/**
 * Antragsnummer im Format JJJJ-NNN (laufende Nummer je Jahr).
 * Die Vergabe erfolgt in der Datenbank (Funktion antrag_einreichen mit Tabelle
 * antragsnummern), damit gleichzeitige Einreichungen nie dieselbe Nummer erhalten.
 */
export function formatAntragsnummer(jahr: number, laufend: number): string {
  return `${jahr}-${String(laufend).padStart(3, "0")}`;
}

export const ANTRAGSNUMMER_MUSTER = /^\d{4}-\d{3,}$/;
