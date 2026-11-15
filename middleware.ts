import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseKonfiguriert } from "@/lib/supabase/env";

const GESCHUETZT = ["/konto", "/antrag", "/stiftungsrat", "/passwort-neu"];

/**
 * Erneuert die Supabase-Sitzung bei jeder Anfrage und schützt die
 * Memberbereiche serverseitig. Die Daten selbst schützt zusätzlich RLS.
 */
export async function middleware(request: NextRequest) {
  let antwort = NextResponse.next({ request });
  if (!supabaseKonfiguriert) return antwort;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(zuSetzen, headers) {
        zuSetzen.forEach(({ name, value }) => request.cookies.set(name, value));
        antwort = NextResponse.next({ request });
        zuSetzen.forEach(({ name, value, options }) => antwort.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => antwort.headers.set(k, v));
      },
    },
  });

  // Nicht entfernen: getUser() erneuert abgelaufene Tokens.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pfad = request.nextUrl.pathname;
  if (!GESCHUETZT.some((p) => pfad === p || pfad.startsWith(p + "/"))) return antwort;

  if (!user) {
    const ziel = request.nextUrl.clone();
    ziel.pathname = "/login";
    ziel.search = `?weiter=${encodeURIComponent(pfad)}`;
    return NextResponse.redirect(ziel);
  }

  if (pfad.startsWith("/stiftungsrat") || pfad.startsWith("/konto") || pfad.startsWith("/antrag")) {
    const { data: profil } = await supabase.from("profiles").select("rolle").eq("id", user.id).single();
    const rat = profil?.rolle === "stiftungsrat";
    if (pfad.startsWith("/stiftungsrat") && !rat) return NextResponse.redirect(new URL("/konto", request.url));
    if (!pfad.startsWith("/stiftungsrat") && rat) return NextResponse.redirect(new URL("/stiftungsrat", request.url));
  }
  return antwort;
}

// Nur Memberbereiche – öffentliche Seiten bleiben ohne Zusatzanfrage schnell.
export const config = {
  matcher: ["/konto/:path*", "/antrag/:path*", "/stiftungsrat/:path*", "/passwort-neu"],
};
