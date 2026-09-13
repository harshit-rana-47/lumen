import { createClient } from "@supabase/supabase-js";
import ws from "ws";
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

export function userExportFileName(exportedAt: string): string {
  const day = exportedAt.slice(0, 10) || "export";
  return `lumen-export-${day}.json`;
}

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
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws as never }
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

    const payload = {
      exportedAt: new Date().toISOString(),
      userId,
      journals: journals ?? [],
      memories: memories ?? [],
      chatSessions: sessions ?? [],
      notice:
        "Encrypted content is omitted from this metadata export. Full decrypted export will ship with Storage-backed ZIP in a later pass."
    };

    const fileName = userExportFileName(payload.exportedAt);
    // Metadata is returned inline. Do not wait on Storage — a hung upload left Take a copy spinning.
    void writeAuditLog({ actorId: userId, action: "user.export" });
    return { payload, fileName };
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
