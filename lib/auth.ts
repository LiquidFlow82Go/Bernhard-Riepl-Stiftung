/**
 * Anmeldung und Sitzung über Supabase Auth.
 * Die Rolle steht in public.profiles und wird nur per SQL auf „stiftungsrat“ gesetzt.
 */
import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "./supabase/client";
import type { Benutzer } from "./types";

export type AuthErgebnis = { ok: true; benutzer: Benutzer } | { ok: false; fehler: string };

/** Übersetzt Fehlermeldungen von Supabase Auth ins Deutsche. */
export function authFehlerText(e: AuthError | Error | null | undefined): string {
  const code = (e as AuthError | undefined)?.code ?? "";
  const msg = e?.message ?? "";
  if (/nicht konfiguriert/i.test(msg))
    return "Die Anmeldung ist auf dieser Seite noch nicht eingerichtet (Supabase-Zugangsdaten fehlen). Bitte wenden Sie sich an die Stiftung.";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(msg))
    return "E-Mail-Adresse oder Passwort sind nicht korrekt.";
  if (code === "email_not_confirmed" || /email not confirmed/i.test(msg))
    return "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse über den Link in unserer E-Mail.";
  if (code === "user_already_exists" || /already registered/i.test(msg))
    return "Für diese E-Mail-Adresse besteht bereits ein Konto.";
  if (code === "weak_password" || /password should/i.test(msg))
    return "Das Passwort ist zu schwach. Bitte wählen Sie ein längeres Passwort mit Buchstaben und Ziffern.";
  if (code === "same_password") return "Das neue Passwort muss sich vom bisherigen unterscheiden.";
  if (code === "over_email_send_rate_limit" || /rate limit/i.test(msg))
    return "Es wurden gerade zu viele E-Mails angefordert. Bitte versuchen Sie es in einigen Minuten erneut.";
  if (/fetch|network/i.test(msg)) return "Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung.";
  return "Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.";
}

/** Lädt das Profil des angemeldeten Benutzers (oder null). */
export async function aktuellerBenutzer(): Promise<Benutzer | null> {
  const sb = supabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data: p } = await sb.from("profiles").select("*").eq("id", user.id).single();
  if (!p) return null;
  return { id: p.id, email: p.email, name: p.name, institution: p.institution || undefined, rolle: p.rolle, kuerzel: p.kuerzel || undefined };
}

export async function anmelden(email: string, passwort: string): Promise<AuthErgebnis> {
  try {
    const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password: passwort });
    if (error) return { ok: false, fehler: authFehlerText(error) };
    const b = await aktuellerBenutzer();
    if (!b) return { ok: false, fehler: "Ihr Profil konnte nicht geladen werden. Bitte wenden Sie sich an die Stiftung." };
    return { ok: true, benutzer: b };
  } catch (e) {
    return { ok: false, fehler: authFehlerText(e as Error) };
  }
}

function ruecksprung(weiter: string): string {
  return `${window.location.origin}/auth/confirm?weiter=${encodeURIComponent(weiter)}`;
}

export type RegistrierErgebnis =
  | { ok: true; bestaetigungNoetig: boolean }
  | { ok: false; fehler: string };

export async function registrieren(d: {
  name: string;
  institution: string;
  email: string;
  passwort: string;
}): Promise<RegistrierErgebnis> {
  try {
    const { data, error } = await supabase().auth.signUp({
      email: d.email.trim(),
      password: d.passwort,
      options: {
        data: { name: d.name.trim(), institution: d.institution.trim() },
        emailRedirectTo: ruecksprung("/konto"),
      },
    });
    if (error) return { ok: false, fehler: authFehlerText(error) };
    // Supabase meldet bei bereits bestehender Adresse aus Datenschutzgründen keinen Fehler,
    // sondern einen Benutzer ohne Identitäten.
    if (data.user && data.user.identities && data.user.identities.length === 0)
      return { ok: false, fehler: "Für diese E-Mail-Adresse besteht bereits ein Konto." };
    return { ok: true, bestaetigungNoetig: !data.session };
  } catch (e) {
    return { ok: false, fehler: authFehlerText(e as Error) };
  }
}

export async function passwortZuruecksetzen(email: string): Promise<{ ok: true } | { ok: false; fehler: string }> {
  try {
    const { error } = await supabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: ruecksprung("/passwort-neu") });
    // Nur echte Störungen melden; ob das Konto existiert, bleibt aus Datenschutzgründen offen.
    if (error && (error.code === "over_email_send_rate_limit" || /rate limit|fetch|network/i.test(error.message)))
      return { ok: false, fehler: authFehlerText(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, fehler: authFehlerText(e as Error) };
  }
}

export async function neuesPasswortSetzen(passwort: string): Promise<{ ok: true } | { ok: false; fehler: string }> {
  try {
    const { error } = await supabase().auth.updateUser({ password: passwort });
    if (error) return { ok: false, fehler: authFehlerText(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, fehler: authFehlerText(e as Error) };
  }
}

export async function abmelden(): Promise<void> {
  await supabase().auth.signOut();
}
