import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// SERVER ONLY: this client uses the Supabase service role key and bypasses RLS.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
