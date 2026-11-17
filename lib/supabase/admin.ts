import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Server-Client mit dem geheimen Schlüssel (umgeht RLS).
 * Nur in Route Handlern verwenden, und erst nachdem Anmeldung und Rolle
 * über die Sitzung geprüft wurden. Nie im Browser-Code importieren.
 */
let admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !key) {
    throw new Error("SUPABASE_SECRET_KEY bzw. NEXT_PUBLIC_SUPABASE_URL fehlt (Vercel → Environment Variables).");
  }
  admin = createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
