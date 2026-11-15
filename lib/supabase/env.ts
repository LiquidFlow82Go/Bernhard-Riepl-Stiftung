/**
 * Supabase-Zugangsdaten. Die Vercel-Integration von Supabase setzt diese
 * Variablen automatisch; lokal stehen sie in .env.local (siehe .env.example).
 * Der geheime Schlüssel (SUPABASE_SECRET_KEY) wird in Phase 2 nicht benötigt:
 * Alle Zugriffe laufen mit dem öffentlichen Schlüssel und Row Level Security.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseKonfiguriert = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export function pruefeKonfiguration(): void {
  if (!supabaseKonfiguriert) {
    throw new Error(
      "Supabase ist nicht konfiguriert: NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY fehlen (.env.local bzw. Vercel).",
    );
  }
}

export const DOKUMENTE_BUCKET = "antragsdokumente";
