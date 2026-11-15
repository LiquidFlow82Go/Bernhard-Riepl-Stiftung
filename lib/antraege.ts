/**
 * Datenzugriff auf Anträge über Supabase. Welche Zeilen sichtbar sind,
 * entscheidet Row Level Security in der Datenbank (siehe supabase/migrations).
 */
import { betrag } from "./betrag";
import { DOKUMENTE_BUCKET } from "./supabase/env";
import { supabase } from "./supabase/client";
import {
  leererAntrag,
  type Absage,
  type Antrag,
  type AntragDaten,
  type AntragStatus,
  type Dokument,
  type DokumentKategorie,
} from "./types";

export interface AntragFilter {
  jahr?: number | "alle";
  status?: AntragStatus | "alle";
  suche?: string;
}

/* ---------- Umwandlung Datenbankzeile → Typ ---------- */

interface DokumentZeile {
  id: string;
  antrag_id: string;
  kategorie: DokumentKategorie;
  dateiname: string;
  mime_type: string;
  groesse: number;
  speicherpfad: string;
  hochgeladen_am: string;
}

interface AbsageZeile {
  grund_id: string;
  grund_titel: string;
  betreff: string;
  text: string;
  empfaenger: string;
  datum: string;
}

interface AntragZeile {
  id: string;
  nummer: string;
  benutzer_id: string;
  eingereicht_am: string;
  aktualisiert_am: string;
  status: AntragStatus;
  bewilligter_betrag: number | string | null;
  daten: Partial<AntragDaten>;
  dokumente?: DokumentZeile[];
  absagen?: AbsageZeile[];
}

const MIT_DETAILS = "*, dokumente(*), absagen(grund_id, grund_titel, betreff, text, empfaenger, datum)";

function zuDokument(z: DokumentZeile): Dokument {
  return {
    id: z.id,
    antragId: z.antrag_id,
    kategorie: z.kategorie,
    dateiname: z.dateiname,
    mimeType: z.mime_type,
    groesse: Number(z.groesse),
    hochgeladenAm: z.hochgeladen_am,
    speicherpfad: z.speicherpfad,
  };
}

function zuAntrag(z: AntragZeile): Antrag {
  const leer = leererAntrag();
  const d = z.daten ?? {};
  const daten: AntragDaten = {
    ...leer,
    ...d,
    antragsteller: { ...leer.antragsteller, ...d.antragsteller },
    projekt: { ...leer.projekt, ...d.projekt },
    anschluss: { ...leer.anschluss, ...d.anschluss },
    kosten: { ...leer.kosten, ...d.kosten },
    finanzierung: { ...leer.finanzierung, ...d.finanzierung },
    konto: { ...leer.konto, ...d.konto },
  };
  const absagen = [...(z.absagen ?? [])].sort((a, b) => b.datum.localeCompare(a.datum));
  const letzte: Absage | null = z.status === "abgelehnt" && absagen[0]
    ? {
        grundId: absagen[0].grund_id,
        grundTitel: absagen[0].grund_titel,
        betreff: absagen[0].betreff,
        text: absagen[0].text,
        empfaenger: absagen[0].empfaenger,
        datum: absagen[0].datum,
      }
    : null;
  return {
    id: z.id,
    nummer: z.nummer,
    benutzerId: z.benutzer_id,
    eingereichtAm: z.eingereicht_am,
    aktualisiertAm: z.aktualisiert_am,
    status: z.status,
    bewilligterBetrag: z.bewilligter_betrag == null ? null : Number(z.bewilligter_betrag),
    absage: letzte,
    daten,
    dokumente: (z.dokumente ?? []).map(zuDokument).sort((a, b) => a.hochgeladenAm.localeCompare(b.hochgeladenAm)),
  };
}

function wirf(error: { message: string } | null, kontext: string): void {
  if (error) throw new Error(`${kontext}: ${error.message}`);
}

/* ---------- Lesen ---------- */

/** Eigene Anträge eines Antragstellers (RLS liefert ohnehin nur eigene). */
export async function ladeEigeneAntraege(benutzerId: string): Promise<Antrag[]> {
  const { data, error } = await supabase()
    .from("antraege")
    .select("*, absagen(grund_id, grund_titel, betreff, text, empfaenger, datum)")
    .eq("benutzer_id", benutzerId)
    .order("eingereicht_am", { ascending: false });
  wirf(error, "Anträge konnten nicht geladen werden");
  return (data as AntragZeile[]).map(zuAntrag);
}

/** Alle Anträge (nur Stiftungsrat, durch RLS abgesichert). */
export async function ladeAlleAntraege(filter: AntragFilter = {}): Promise<Antrag[]> {
  let q = supabase().from("antraege").select("*").order("eingereicht_am", { ascending: false });
  if (filter.jahr && filter.jahr !== "alle") q = q.like("nummer", `${filter.jahr}-%`);
  if (filter.status && filter.status !== "alle") q = q.eq("status", filter.status);
  const suche = (filter.suche ?? "").replace(/[,()%*\\]/g, " ").trim();
  if (suche) q = q.or(`nummer.ilike.%${suche}%,antragsteller_name.ilike.%${suche}%,projekt_titel.ilike.%${suche}%`);
  const { data, error } = await q;
  wirf(error, "Anträge konnten nicht geladen werden");
  return (data as AntragZeile[]).map(zuAntrag);
}

export async function ladeAntrag(id: string): Promise<Antrag | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase().from("antraege").select(MIT_DETAILS).eq("id", id).maybeSingle();
  wirf(error, "Antrag konnte nicht geladen werden");
  return data ? zuAntrag(data as AntragZeile) : null;
}

export async function verfuegbareJahre(): Promise<number[]> {
  const { data } = await supabase().from("antraege").select("nummer");
  const jahre = new Set((data ?? []).map((z: { nummer: string }) => parseInt(z.nummer.slice(0, 4), 10)));
  jahre.add(new Date().getFullYear());
  return [...jahre].sort((a, b) => b - a);
}

/* ---------- Einreichen ---------- */

export interface NeuesDokument {
  kategorie: DokumentKategorie;
  datei: File;
}

export interface EinreichenErgebnis {
  antrag: Antrag;
  /** Dateien, deren Upload fehlgeschlagen ist (Antrag ist trotzdem eingegangen). */
  fehlgeschlagen: string[];
}

function sichererDateiname(n: string): string {
  const punkt = n.lastIndexOf(".");
  const basis = (punkt > 0 ? n.slice(0, punkt) : n)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const endung = punkt > 0 ? n.slice(punkt).toLowerCase() : "";
  return (basis || "datei") + endung;
}

/**
 * Reicht einen Antrag ein. Die Datenbankfunktion antrag_einreichen() prüft die
 * Pflichtangaben und vergibt die Antragsnummer; danach werden die Dokumente
 * in den privaten Bucket hochgeladen.
 */
export async function reicheAntragEin(daten: AntragDaten, dokumente: NeuesDokument[]): Promise<EinreichenErgebnis> {
  const sb = supabase();
  const { data, error } = await sb.rpc("antrag_einreichen", {
    p_daten: daten,
    p_betrag_beantragt: betrag(daten.finanzierung.stiftung),
  });
  wirf(error, "Der Antrag konnte nicht eingereicht werden");
  const antragId = (data as AntragZeile).id;

  const fehlgeschlagen: string[] = [];
  for (const d of dokumente) {
    const pfad = `${antragId}/${crypto.randomUUID()}-${sichererDateiname(d.datei.name)}`;
    const hoch = await sb.storage.from(DOKUMENTE_BUCKET).upload(pfad, d.datei, {
      contentType: d.datei.type || "application/octet-stream",
      upsert: false,
    });
    if (hoch.error) {
      fehlgeschlagen.push(d.datei.name);
      continue;
    }
    const { error: metaFehler } = await sb.from("dokumente").insert({
      antrag_id: antragId,
      kategorie: d.kategorie,
      dateiname: d.datei.name,
      mime_type: d.datei.type || "application/octet-stream",
      groesse: d.datei.size,
      speicherpfad: pfad,
    });
    if (metaFehler) fehlgeschlagen.push(d.datei.name);
  }

  const antrag = await ladeAntrag(antragId);
  if (!antrag) throw new Error("Der Antrag wurde gespeichert, konnte aber nicht erneut geladen werden.");
  return { antrag, fehlgeschlagen };
}

/* ---------- Stiftungsrat ---------- */

export async function aendereStatus(id: string, status: AntragStatus, bewilligterBetrag?: number | null): Promise<Antrag> {
  const aenderung: { status: AntragStatus; bewilligter_betrag?: number | null } = { status };
  if (bewilligterBetrag !== undefined) aenderung.bewilligter_betrag = bewilligterBetrag;
  const { error } = await supabase().from("antraege").update(aenderung).eq("id", id);
  wirf(error, "Status konnte nicht gespeichert werden");
  const a = await ladeAntrag(id);
  if (!a) throw new Error("Antrag nicht gefunden");
  return a;
}

/** Setzt den Status auf „Abgelehnt“ und hält Grund, Text und Datum fest. */
export async function lehneAntragAb(id: string, absage: Omit<Absage, "datum">): Promise<Antrag> {
  const { error } = await supabase().rpc("antrag_ablehnen", {
    p_antrag_id: id,
    p_grund_id: absage.grundId,
    p_grund_titel: absage.grundTitel,
    p_betreff: absage.betreff,
    p_text: absage.text,
    p_empfaenger: absage.empfaenger,
  });
  wirf(error, "Die Absage konnte nicht gespeichert werden");
  const a = await ladeAntrag(id);
  if (!a) throw new Error("Antrag nicht gefunden");
  return a;
}
