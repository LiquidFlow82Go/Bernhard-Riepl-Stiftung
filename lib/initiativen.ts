/**
 * Datenzugriff „Eigene Initiativen“ über Supabase. Lesen und Bearbeiten
 * erlaubt die Datenbank (RLS) nur Stiftungsvorstand und Admin; Statuswechsel
 * und Löschen laufen über Server-Routen.
 */
import { betrag as betragVon } from "./betrag";
import { pruefeDatei } from "./dokumente";
import {
  partnerAnzeige,
  vervollstaendige,
  type EmpfaengerArt,
  type InitiativDaten,
  type InitiativDokKategorie,
  type InitiativDokument,
  type Initiative,
  type InitiativStatus,
  type Person,
  type VerlaufEintrag,
} from "./initiativeTypen";
import { supabase } from "./supabase/client";

export const INITIATIV_BUCKET = "initiativen";

const PERSON = "name, email, kuerzel";
const LISTE = `*, ersteller:profiles!initiativen_erstellt_von_fkey(${PERSON})`;
const DETAIL =
  `${LISTE}, initiativ_dokumente(*), ` +
  `initiativ_status_verlauf(von_status, nach_status, grund, geaendert_am, person:profiles!initiativ_status_verlauf_geaendert_von_fkey(${PERSON}))`;

type PersonZeile = Person | Person[] | null | undefined;

interface Zeile {
  id: string;
  aktenzeichen: string;
  jahr: number;
  datum: string;
  status: InitiativStatus;
  projekt_titel: string;
  partner_name: string;
  empfaenger_art?: EmpfaengerArt;
  foerderbetrag: number | string | null;
  daten: Partial<InitiativDaten>;
  erstellt_von: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
  ersteller?: PersonZeile;
  initiativ_dokumente?: {
    id: string;
    kategorie: InitiativDokKategorie;
    dateiname: string;
    mime_type: string;
    groesse: number | string;
    speicherpfad: string;
    hochgeladen_am: string;
  }[];
  initiativ_status_verlauf?: {
    von_status: InitiativStatus | null;
    nach_status: InitiativStatus;
    grund: string | null;
    geaendert_am: string;
    person?: PersonZeile;
  }[];
}

const eins = (p: PersonZeile): Person | null => (Array.isArray(p) ? p[0] ?? null : p ?? null);

function zuInitiative(z: Zeile): Initiative {
  const verlauf: VerlaufEintrag[] = (z.initiativ_status_verlauf ?? [])
    .map((v) => ({ von: v.von_status, nach: v.nach_status, grund: v.grund, am: v.geaendert_am, durch: eins(v.person) }))
    .sort((a, b) => a.am.localeCompare(b.am));
  const dokumente: InitiativDokument[] = (z.initiativ_dokumente ?? [])
    .map((d) => ({
      id: d.id,
      kategorie: d.kategorie,
      dateiname: d.dateiname,
      mimeType: d.mime_type,
      groesse: Number(d.groesse),
      speicherpfad: d.speicherpfad,
      hochgeladenAm: d.hochgeladen_am,
    }))
    .sort((a, b) => a.hochgeladenAm.localeCompare(b.hochgeladenAm));
  return {
    id: z.id,
    aktenzeichen: z.aktenzeichen,
    jahr: z.jahr,
    datum: z.datum,
    status: z.status,
    projektTitel: z.projekt_titel,
    partnerName: z.partner_name,
    empfaengerArt: z.empfaenger_art ?? "organisation",
    foerderbetrag: z.foerderbetrag == null ? null : Number(z.foerderbetrag),
    daten: vervollstaendige(z.daten),
    erstelltVon: eins(z.ersteller),
    erstelltVonId: z.erstellt_von,
    erstelltAm: z.erstellt_am,
    aktualisiertAm: z.aktualisiert_am,
    dokumente,
    verlauf,
  };
}

function wirf(error: { message: string } | null, kontext: string): void {
  if (error) throw new Error(`${kontext}: ${error.message}`);
}

/* ---------- Lesen ---------- */

export async function ladeInitiativen(): Promise<Initiative[]> {
  const { data, error } = await supabase().from("initiativen").select(LISTE).order("aktenzeichen", { ascending: false });
  wirf(error, "Initiativen konnten nicht geladen werden");
  return (data as unknown as Zeile[]).map(zuInitiative);
}

export async function ladeInitiative(id: string): Promise<Initiative | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase().from("initiativen").select(DETAIL).eq("id", id).maybeSingle();
  wirf(error, "Initiative konnte nicht geladen werden");
  return data ? zuInitiative(data as unknown as Zeile) : null;
}

/** Anzahl für die Umschaltung. null = nicht verfügbar (z. B. Migration fehlt). */
export async function zaehle(tabelle: "antraege" | "initiativen"): Promise<number | null> {
  const { count, error } = await supabase().from(tabelle).select("id", { count: "exact", head: true });
  return error ? null : count ?? 0;
}

/* ---------- Schreiben ---------- */

function spalten(d: InitiativDaten) {
  const b = betragVon(d.finanzen.betrag);
  return {
    datum: /^\d{4}-\d{2}-\d{2}$/.test(d.stammdaten.datum) ? d.stammdaten.datum : undefined,
    projekt_titel: d.stammdaten.titel.trim().slice(0, 300),
    // Bei Einzelfallhilfe nur „Einzelfallhilfe – M. K.“ in der Listenspalte (Datensparsamkeit)
    partner_name: partnerAnzeige(d).slice(0, 300),
    empfaenger_art: d.stammdaten.empfaengerArt || "organisation",
    foerderbetrag: b > 0 ? b : null,
    daten: d,
  };
}

/** Legt die Initiative an (vergibt das Aktenzeichen) und speichert alle Angaben. */
export async function legeInitiativeAn(d: InitiativDaten): Promise<Initiative> {
  const sb = supabase();
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(d.stammdaten.datum) ? d.stammdaten.datum : null;
  const { data, error } = await sb.rpc("initiative_anlegen", { p_daten: d, p_datum: datum });
  wirf(error, "Die Initiative konnte nicht angelegt werden");
  const id = (data as { id: string }).id;
  return speichereInitiative(id, d);
}

export async function speichereInitiative(id: string, d: InitiativDaten): Promise<Initiative> {
  const { error } = await supabase().from("initiativen").update(spalten(d)).eq("id", id);
  wirf(error, "Speichern fehlgeschlagen");
  const neu = await ladeInitiative(id);
  if (!neu) throw new Error("Die Initiative wurde gespeichert, konnte aber nicht erneut geladen werden.");
  return neu;
}

function sichererDateiname(n: string): string {
  const s = n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_");
  return s.slice(-80) || "datei";
}

/** Lädt eine Datei zur Initiative hoch (Pfad <Aktenzeichen>/<uuid>-<name>). */
export async function ladeInitiativDateiHoch(i: Initiative, kategorie: InitiativDokKategorie, datei: File): Promise<void> {
  const p = pruefeDatei(datei);
  if (p) throw new Error(p);
  const sb = supabase();
  const pfad = `${i.aktenzeichen}/${crypto.randomUUID()}-${sichererDateiname(datei.name)}`;
  const hoch = await sb.storage.from(INITIATIV_BUCKET).upload(pfad, datei, {
    contentType: datei.type || "application/octet-stream",
    upsert: false,
  });
  if (hoch.error) throw new Error(`„${datei.name}“ konnte nicht hochgeladen werden.`);
  const { error } = await sb.from("initiativ_dokumente").insert({
    initiative_id: i.id,
    kategorie,
    dateiname: datei.name,
    mime_type: datei.type || "application/octet-stream",
    groesse: datei.size,
    speicherpfad: pfad,
  });
  if (error) {
    await sb.storage.from(INITIATIV_BUCKET).remove([pfad]);
    throw new Error(`„${datei.name}“ konnte nicht gespeichert werden.`);
  }
}

/** Entfernt ein Dokument (nur im Entwurf, per RLS abgesichert). */
export async function entferneInitiativDatei(d: InitiativDokument): Promise<void> {
  const sb = supabase();
  const { data, error } = await sb.from("initiativ_dokumente").delete().eq("id", d.id).select("id");
  wirf(error, "Das Dokument konnte nicht entfernt werden");
  if (!data?.length) throw new Error("Dokumente lassen sich nur im Entwurf entfernen.");
  await sb.storage.from(INITIATIV_BUCKET).remove([d.speicherpfad]);
}

export async function initiativDateiLink(d: InitiativDokument, herunterladen: boolean): Promise<string> {
  const { data, error } = await supabase()
    .storage.from(INITIATIV_BUCKET)
    .createSignedUrl(d.speicherpfad, 120, herunterladen ? { download: d.dateiname } : undefined);
  if (error || !data) throw new Error("Das Dokument konnte nicht geladen werden.");
  return data.signedUrl;
}

/* ---------- Server-Routen ---------- */

async function post(url: string, body: unknown): Promise<{ ok: boolean; daten: Record<string, unknown> }> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    return { ok: r.ok, daten: (await r.json().catch(() => ({}))) as Record<string, unknown> };
  } catch {
    return { ok: false, daten: { fehler: "Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung." } };
  }
}

export async function setzeInitiativStatus(
  id: string,
  status: InitiativStatus,
  grund: string,
): Promise<{ ok: true } | { ok: false; fehler: string; fehlend?: Record<string, string> }> {
  const { ok, daten } = await post(`/api/initiativen/${id}/status`, { status, grund });
  if (ok) return { ok: true };
  return {
    ok: false,
    fehler: (daten.fehler as string) ?? "Der Status konnte nicht geändert werden.",
    fehlend: daten.fehlend as Record<string, string> | undefined,
  };
}

export async function loescheInitiative(id: string, bestaetigung: string): Promise<{ ok: true } | { ok: false; fehler: string }> {
  const { ok, daten } = await post(`/api/initiativen/${id}/loeschen`, { bestaetigung });
  if (ok) return { ok: true };
  return { ok: false, fehler: (daten.fehler as string) ?? "Die Initiative konnte nicht gelöscht werden." };
}
