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
    // Falsche Rolle (z. B. Link aus einer E-Mail): in den eigenen Bereich mit Hinweis
    // und der Möglichkeit, sich mit dem passenden Konto neu anzumelden.
    if (pfad.startsWith("/stiftungsrat") && !rat) {
      const ziel = new URL("/konto", request.url);
      ziel.searchParams.set("hinweis", "anderes-konto");
      ziel.searchParams.set("weiter", pfad);
      return NextResponse.redirect(ziel);
    }
    if (!pfad.startsWith("/stiftungsrat") && rat) {
      const ziel = new URL("/stiftungsrat", request.url);
      if (pfad.startsWith("/konto/antraege/")) {
        ziel.searchParams.set("hinweis", "anderes-konto");
        ziel.searchParams.set("weiter", pfad);
      }
      return NextResponse.redirect(ziel);
    }
  }
  return antwort;
}

// Nur Memberbereiche – öffentliche Seiten bleiben ohne Zusatzanfrage schnell.
export const config = {
  matcher: ["/konto/:path*", "/antrag/:path*", "/stiftungsrat/:path*", "/passwort-neu"],
};
