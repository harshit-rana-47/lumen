import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Access model (Phase 1.5):
 *
 * - supabaseAdmin (service role): auth admin, workers, DEK unwrap, audit inserts,
 *   account purge, and any operation that must bypass RLS. Trusted server only.
 * - createUserScopedClient(jwt): authenticated PostgREST client subject to RLS.
 *   Prefer for user-owned CRUD once RLS is verified on the live project.
 */

// SERVER ONLY: service role bypasses RLS.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export function createUserScopedClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export type DbClient = SupabaseClient;
