/**
 * Datenzugriff auf Anträge. Alle Komponenten verwenden ausschließlich diese
 * Funktionen. Phase 1: Beispieldaten im Browser. Phase 2: Supabase-Abfragen
 * mit Row Level Security – die Signaturen bleiben gleich.
 */
import { naechsteAntragsnummer } from "./antragsnummer";
import { db, speichern, warte } from "./mockDb";
import type { Absage, Antrag, AntragDaten, AntragStatus, Dokument } from "./types";

export interface AntragFilter {
  jahr?: number | "alle";
  status?: AntragStatus | "alle";
  suche?: string;
}

const sortiert = (l: Antrag[]) =>
  [...l].sort((a, b) => b.eingereichtAm.localeCompare(a.eingereichtAm));

/** Eigene Anträge eines Antragstellers. */
export async function ladeEigeneAntraege(benutzerId: string): Promise<Antrag[]> {
  await warte();
  return structuredClone(sortiert(db().antraege.filter((a) => a.benutzerId === benutzerId)));
}

/** Alle Anträge (nur Stiftungsrat). */
export async function ladeAlleAntraege(filter: AntragFilter = {}): Promise<Antrag[]> {
  await warte();
  const q = (filter.suche ?? "").trim().toLowerCase();
  return structuredClone(
    sortiert(
      db().antraege.filter((a) => {
        if (filter.jahr && filter.jahr !== "alle" && !a.nummer.startsWith(String(filter.jahr))) return false;
        if (filter.status && filter.status !== "alle" && a.status !== filter.status) return false;
        if (q) {
          const heu = `${a.nummer} ${a.daten.antragsteller.name} ${a.daten.projekt.titel}`.toLowerCase();
          if (!heu.includes(q)) return false;
        }
        return true;
      }),
    ),
  );
}

export async function ladeAntrag(id: string): Promise<Antrag | null> {
  await warte();
  const a = db().antraege.find((x) => x.id === id);
  return a ? structuredClone(a) : null;
}

export async function verfuegbareJahre(): Promise<number[]> {
  const jahre = new Set(db().antraege.map((a) => parseInt(a.nummer.slice(0, 4), 10)));
  jahre.add(new Date().getFullYear());
  return [...jahre].sort((a, b) => b - a);
}

export interface EinreichenErgebnis {
  antrag: Antrag;
}

/** Reicht einen Antrag ein und vergibt die Antragsnummer. */
export async function reicheAntragEin(
  benutzerId: string,
  daten: AntragDaten,
  dokumente: Omit<Dokument, "antragId" | "id">[],
): Promise<EinreichenErgebnis> {
  await warte(400);
  const nummer = await naechsteAntragsnummer();
  const id = `a-${nummer}`;
  const jetzt = new Date().toISOString();
  const antrag: Antrag = {
    id,
    nummer,
    benutzerId,
    eingereichtAm: jetzt,
    aktualisiertAm: jetzt,
    status: "eingegangen",
    bewilligterBetrag: null,
    absage: null,
    daten: structuredClone(daten),
    dokumente: dokumente.map((d, i) => ({ ...d, id: `${id}-d${i + 1}`, antragId: id })),
  };
  db().antraege.push(antrag);
  speichern();
  return { antrag: structuredClone(antrag) };
}

export async function aendereStatus(
  id: string,
  status: AntragStatus,
  bewilligterBetrag?: number | null,
): Promise<Antrag> {
  await warte();
  const a = db().antraege.find((x) => x.id === id);
  if (!a) throw new Error("Antrag nicht gefunden");
  a.status = status;
  if (bewilligterBetrag !== undefined) a.bewilligterBetrag = bewilligterBetrag;
  if (status !== "abgelehnt") a.absage = null;
  a.aktualisiertAm = new Date().toISOString();
  speichern();
  return structuredClone(a);
}

/** Setzt den Status auf „Abgelehnt“ und hält Grund, Text und Datum fest. */
export async function lehneAntragAb(id: string, absage: Omit<Absage, "datum">): Promise<Antrag> {
  await warte();
  const a = db().antraege.find((x) => x.id === id);
  if (!a) throw new Error("Antrag nicht gefunden");
  a.status = "abgelehnt";
  a.absage = { ...absage, datum: new Date().toISOString() };
  a.aktualisiertAm = a.absage.datum;
  speichern();
  return structuredClone(a);
}
