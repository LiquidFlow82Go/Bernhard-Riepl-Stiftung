import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Rücksprung aus den E-Mails von Supabase Auth (Konto bestätigen, Passwort zurücksetzen).
 * Unterstützt beide Link-Formen:
 *  - ?token_hash=…&type=…  (empfohlene E-Mail-Vorlage, funktioniert in jedem Browser)
 *  - ?code=…               (Standardvorlage von Supabase, PKCE)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const weiterRoh = url.searchParams.get("weiter") ?? "/konto";
  const weiter = weiterRoh.startsWith("/") && !weiterRoh.startsWith("//") ? weiterRoh : "/konto";
  const tokenHash = url.searchParams.get("token_hash");
  const typ = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");

  let ok = false;
  try {
    const supabase = await supabaseServer();
    if (tokenHash && typ) {
      const { error } = await supabase.auth.verifyOtp({ type: typ, token_hash: tokenHash });
      ok = !error;
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      ok = !error;
    }
  } catch {
    ok = false;
  }

  const ziel = ok ? (typ === "recovery" ? "/passwort-neu" : weiter) : "/login?hinweis=link-ungueltig";
  return NextResponse.redirect(new URL(ziel, url.origin));
}
