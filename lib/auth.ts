/**
 * Anmeldung und Sitzung.
 * Phase 1: Testanmeldung mit Beispielkonten, Sitzung im localStorage.
 * Phase 2: Supabase Auth (signInWithPassword, signUp, resetPasswordForEmail);
 * die Rolle kommt aus der Tabelle profiles. Die Funktionssignaturen bleiben.
 */
import { BEISPIEL_BENUTZER, TEST_PASSWORT } from "./beispieldaten";
import { db, speichern, warte } from "./mockDb";
import type { Benutzer, Rolle } from "./types";

const SITZUNG_KEY = "brs-sitzung-v1";

export function aktuelleSitzung(): Benutzer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SITZUNG_KEY);
    return raw ? (JSON.parse(raw) as Benutzer) : null;
  } catch {
    return null;
  }
}

function setzeSitzung(b: Benutzer | null) {
  try {
    if (b) window.localStorage.setItem(SITZUNG_KEY, JSON.stringify(b));
    else window.localStorage.removeItem(SITZUNG_KEY);
  } catch {
    /* ignorieren */
  }
  window.dispatchEvent(new Event("brs-sitzung"));
}

export type AuthErgebnis = { ok: true; benutzer: Benutzer } | { ok: false; fehler: string };

export async function anmelden(email: string, passwort: string): Promise<AuthErgebnis> {
  await warte(300);
  const b = db().benutzer.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!b || passwort !== TEST_PASSWORT)
    return { ok: false, fehler: "E-Mail-Adresse oder Passwort sind nicht korrekt." };
  setzeSitzung(b);
  return { ok: true, benutzer: b };
}

/** Testanmeldung per Schalter (nur Phase 1). */
export async function testAnmeldung(rolle: Rolle): Promise<Benutzer> {
  const b = BEISPIEL_BENUTZER.find((x) => x.rolle === rolle)!;
  setzeSitzung(b);
  return b;
}

export async function registrieren(d: {
  name: string;
  institution: string;
  email: string;
  passwort: string;
}): Promise<AuthErgebnis> {
  await warte(400);
  if (db().benutzer.some((x) => x.email.toLowerCase() === d.email.toLowerCase()))
    return { ok: false, fehler: "Für diese E-Mail-Adresse besteht bereits ein Konto." };
  const b: Benutzer = {
    id: `u-${Date.now()}`,
    email: d.email,
    name: d.name,
    institution: d.institution,
    rolle: "antragsteller",
  };
  db().benutzer.push(b);
  speichern();
  // Phase 2: Bestätigungs-E-Mail durch Supabase; bis dahin direkte Anmeldung.
  setzeSitzung(b);
  return { ok: true, benutzer: b };
}

export async function passwortZuruecksetzen(_email: string): Promise<{ ok: true }> {
  await warte(400);
  // Aus Datenschutzgründen immer dieselbe Antwort, egal ob das Konto existiert.
  return { ok: true };
}

export async function abmelden(): Promise<void> {
  setzeSitzung(null);
}
