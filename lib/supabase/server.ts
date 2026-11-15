import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { pruefeKonfiguration, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/** Supabase-Client für Server Components und Route Handler (pro Anfrage neu). */
export async function supabaseServer() {
  pruefeKonfiguration();
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(zuSetzen) {
        try {
          zuSetzen.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // In Server Components nicht möglich – die Middleware erneuert die Sitzung.
        }
      },
    },
  });
}
