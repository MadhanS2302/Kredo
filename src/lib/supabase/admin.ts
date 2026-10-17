import { createClient } from "@supabase/supabase-js";

// SERVER ONLY. Uses the secret service-role key, which bypasses row-level security.
// Never import this file from a "use client" component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local (see README, Part 2)."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
