import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the service role key, which bypasses Row Level Security.
// Only import this file from API route handlers (app/api/**), never from
// anything that ships to the browser — the service role key must stay secret.
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
