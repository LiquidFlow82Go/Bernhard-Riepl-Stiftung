import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pruefeKonfiguration, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

let client: SupabaseClient | null = null;

/** Supabase-Client für den Browser (eine Instanz pro Seite). */
export function supabase(): SupabaseClient {
  if (client) return client;
  pruefeKonfiguration();
  client = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return client;
}
