import { supabaseAdmin } from "../../config/supabase";
import { writeAuditLog } from "../../lib/audit";
import { generateDEK, wrapDEK } from "../../lib/encrypt";
import type { LoginInput, LogoutInput, RefreshInput, RegisterInput } from "./auth.schema";

type PublicUserProfile = {
  id: string;
  email: string;
  name: string | null;
  created_at?: string;
  updated_at?: string;
};

type RegisterResult = {
  user: {
    id: string;
    email?: string;
  };
  profile: PublicUserProfile;
};

function stripSensitiveProfileFields(profile: Record<string, unknown>): PublicUserProfile {
  const { encrypted_dek: _encryptedDEK, encrypted_dek_iv: _iv, encrypted_dek_tag: _tag, ...safe } = profile;

  return safe as PublicUserProfile;
}

export class AuthService {
  async register(input: RegisterInput): Promise<RegisterResult> {
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name
      }
    });

    if (createUserError) {
      throw createUserError;
    }

    if (!authData.user) {
      throw new Error("Supabase Auth did not return a created user");
    }

    const authUser = authData.user;
    const encryptedDEK = wrapDEK(generateDEK());

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authUser.id,
        email: input.email,
        name: input.name,
        encrypted_dek: encryptedDEK
      })
      .select("id,email,name,created_at,updated_at")
      .single<PublicUserProfile>();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      throw profileError;
    }

    await writeAuditLog({
      actorId: authUser.id,
      action: "auth.register",
      metadata: { email: input.email }
    });

    const user: RegisterResult["user"] = {
      id: authUser.id
    };

    if (authUser.email) {
      user.email = authUser.email;
    }

    return {
      user,
      profile
    };
  }

  async login(input: LoginInput) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await writeAuditLog({ actorId: data.user.id, action: "auth.login" });
    }

    return data;
  }

  async refresh(input: RefreshInput) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: input.refreshToken
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await writeAuditLog({ actorId: data.user.id, action: "auth.refresh" });
    }

    return data;
  }

  async logout(input: LogoutInput): Promise<{ success: true }> {
    const { data: userData } = await supabaseAdmin.auth.getUser(input.accessToken);
    const { error } = await supabaseAdmin.auth.admin.signOut(input.accessToken);

    if (error) {
      throw error;
    }

    if (userData.user) {
      await writeAuditLog({ actorId: userData.user.id, action: "auth.logout" });
    }

    return { success: true };
  }

  async me(userId: string): Promise<PublicUserProfile> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id,email,name,created_at,updated_at")
      .eq("id", userId)
      .single<Record<string, unknown>>();

    if (error) {
      throw error;
    }

    return stripSensitiveProfileFields(data);
  }
}

export const authService = new AuthService();
