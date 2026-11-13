/**
 * Antragsnummer im Format JJJJ-NNN (laufende Nummer je Jahr).
 * Phase 2: als Postgres-Funktion mit Sperre umsetzen (z. B. rpc("naechste_antragsnummer")),
 * damit gleichzeitige Einreichungen keine doppelte Nummer erhalten.
 */
import { db } from "./mockDb";

export function formatAntragsnummer(jahr: number, laufend: number): string {
  return `${jahr}-${String(laufend).padStart(3, "0")}`;
}

export async function naechsteAntragsnummer(datum = new Date()): Promise<string> {
  const jahr = datum.getFullYear();
  const max = db()
    .antraege.filter((a) => a.nummer.startsWith(`${jahr}-`))
    .reduce((m, a) => Math.max(m, parseInt(a.nummer.slice(5), 10) || 0), 0);
  return formatAntragsnummer(jahr, max + 1);
}
