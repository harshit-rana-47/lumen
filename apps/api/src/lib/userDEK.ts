import { supabaseAdmin } from "../config/supabase";
import { type EncryptedPayload, unwrapDEK } from "./encrypt";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedDEK = {
  dek: string;
  expiresAt: number;
};

type UserDEKRow = {
  encrypted_dek: EncryptedPayload | string | null;
};

const dekCache = new Map<string, CachedDEK>();

function parseEncryptedDEK(value: UserDEKRow["encrypted_dek"]): EncryptedPayload {
  if (!value) {
    throw new Error("User encrypted_dek is missing");
  }

  if (typeof value === "string") {
    return JSON.parse(value) as EncryptedPayload;
  }

  return value;
}

export async function getUserDEK(userId: string): Promise<string> {
  const cached = dekCache.get(userId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.dek;
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("encrypted_dek")
    .eq("id", userId)
    .single<UserDEKRow>();

  if (error) {
    throw error;
  }

  const dek = unwrapDEK(parseEncryptedDEK(data.encrypted_dek));

  dekCache.set(userId, {
    dek,
    expiresAt: Date.now() + CACHE_TTL_MS
  });

  return dek;
}

export function clearUserDEKCache(userId?: string): void {
  if (userId) {
    dekCache.delete(userId);
    return;
  }

  dekCache.clear();
}
