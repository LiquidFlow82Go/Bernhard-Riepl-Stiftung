import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../supabase/admin";
import { supabaseServer } from "../supabase/server";
import type { AntragStatus, Rolle } from "../types";

/** Angemeldeter Benutzer mit Rolle – geprüft über die Supabase-Sitzung (Cookies). */
export async function sitzung(): Promise<{ id: string; rolle: Rolle } | null> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await supabaseAdmin().from("profiles").select("rolle").eq("id", user.id).single();
  if (!data) return null;
  return { id: user.id, rolle: data.rolle as Rolle };
}

export interface AntragKern {
  id: string;
  nummer: string;
  benutzer_id: string;
  eingereicht_am: string;
  status: AntragStatus;
  betrag_beantragt: number | string;
  antragsteller_name: string | null;
  projekt_titel: string | null;
  /** bestätigte Konto-Adresse des Antragstellers */
  konto_email: string;
}

/** Lädt die für E-Mails nötigen Angaben (Empfänger immer aus der Datenbank). */
export async function ladeAntragKern(id: string): Promise<AntragKern | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabaseAdmin()
    .from("antraege")
    .select("id, nummer, benutzer_id, eingereicht_am, status, betrag_beantragt, antragsteller_name, projekt_titel, profiles(email)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const p = (data as unknown as { profiles: { email: string } | { email: string }[] | null }).profiles;
  const email = Array.isArray(p) ? p[0]?.email : p?.email;
  return { ...(data as unknown as AntragKern), konto_email: email ?? "" };
}

export function antwort(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function datumDe(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
}

export function euro(n: number | string): string {
  return Number(n).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export const MINUTEN = 60_000;
