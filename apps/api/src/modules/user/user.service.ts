import { createClient } from "@supabase/supabase-js";
import { env } from "../../config/env";
import { supabaseAdmin } from "../../config/supabase";
import { writeAuditLog } from "../../lib/audit";
import { clearUserDEKCache } from "../../lib/userDEK";
import { purgeUserStorage, USER_STORAGE_BUCKETS } from "../../lib/userStorage";
import type { DeleteAccountInput, UpdatePasswordInput, UpdateProfileInput } from "./user.schema";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export { USER_STORAGE_BUCKETS };

/** Owned rows that must be removed on account deletion. audit_logs are retained. */
export const USER_DATA_TABLES = [
  "chat_messages",
  "chat_sessions",
  "media_attachments",
  "memory_items",
  "memory_settings",
  "insights",
  "goals",
  "daily_logs",
  "journal_entries"
] as const;

export class UserService {
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (input.name !== undefined) {
      payload.name = input.name;
    }

    if (input.email !== undefined) {
      payload.email = input.email;
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: input.email
      });

      if (authError) {
        throw authError;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(payload)
      .eq("id", userId)
      .select("id,email,name,created_at,updated_at")
      .single<UserRow>();

    if (error) {
      throw error;
    }

    await writeAuditLog({ actorId: userId, action: "user.profile.update" });
    return data;
  }

  async updatePassword(userId: string, input: UpdatePasswordInput, _accessToken: string) {
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userId)
      .single<{ email: string }>();

    if (!profile?.email) {
      throw new Error("User email not found");
    }

    const verifier = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: profile.email,
      password: input.currentPassword
    });

    if (verifyError) {
      throw new Error("Current password is incorrect");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: input.newPassword
    });

    if (error) {
      throw error;
    }

    await writeAuditLog({ actorId: userId, action: "user.password.update" });
    return { updated: true as const };
  }

  async exportData(userId: string) {
    const [{ data: journals }, { data: memories }, { data: sessions }] = await Promise.all([
      supabaseAdmin
        .from("journal_entries")
        .select("id,entry_date,journal_type,created_at,updated_at")
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabaseAdmin.from("memory_items").select("id,category,key,created_at,updated_at").eq("user_id", userId),
      supabaseAdmin.from("chat_sessions").select("id,mode,created_at,updated_at").eq("user_id", userId)
    ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      userId,
      journals: journals ?? [],
      memories: memories ?? [],
      chatSessions: sessions ?? [],
      notice:
        "Encrypted content is omitted from this metadata export. Full decrypted export will ship with Storage-backed ZIP in a later pass."
    };

    const blob = Buffer.from(JSON.stringify(exportPayload, null, 2), "utf8");
    const path = `${userId}/exports/lumen-export-${Date.now()}.json`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("user-exports")
      .upload(path, blob, { contentType: "application/json", upsert: true });

    if (uploadError) {
      await writeAuditLog({ actorId: userId, action: "user.export", metadata: { fallback: true } });
      return {
        signedUrl: `data:application/json;base64,${blob.toString("base64")}`,
        fallback: true
      };
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from("user-exports")
      .createSignedUrl(path, 60 * 15);

    if (signedError || !signed?.signedUrl) {
      throw signedError ?? new Error("Unable to create export signed URL");
    }

    await writeAuditLog({ actorId: userId, action: "user.export" });
    return { signedUrl: signed.signedUrl, fallback: false };
  }

  /**
   * Verified account deletion.
   * Requires confirmation phrase. Purges Storage, deletes owned rows,
   * invalidates sessions, then removes the Auth user. Audit rows are retained.
   */
  async deleteAccount(userId: string, _input: DeleteAccountInput, accessToken: string) {
    await writeAuditLog({ actorId: userId, action: "user.account.delete.start" });

    await purgeUserStorage(userId);

    const tableErrors: Array<{ table: string; message: string }> = [];
    for (const table of USER_DATA_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
      if (error) {
        tableErrors.push({ table, message: error.message });
        await writeAuditLog({
          actorId: userId,
          action: "user.account.delete.table_error",
          resource: table,
          metadata: { message: error.message }
        });
      }
    }

    if (tableErrors.length > 0) {
      throw new Error(
        `Account deletion stopped: could not remove ${tableErrors.map((item) => item.table).join(", ")}`
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("users")
      .update({
        deleted_at: new Date().toISOString(),
        email: `deleted+${userId}@lumen.invalid`,
        name: null,
        encrypted_dek: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (profileError) {
      throw profileError;
    }

    clearUserDEKCache(userId);

    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(accessToken);
    if (signOutError) {
      await writeAuditLog({
        actorId: userId,
        action: "user.account.delete.signout_error",
        metadata: { message: signOutError.message }
      });
    }

    await writeAuditLog({ actorId: userId, action: "user.account.delete.complete" });

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      throw authError;
    }

    return { deleted: true as const };
  }
}

export const userService = new UserService();
