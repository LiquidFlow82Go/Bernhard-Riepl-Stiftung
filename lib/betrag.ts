/**
 * Betragslogik aus der HTML-Vorlage (parseAmt, fmt, totals) übernommen.
 */
import type { FinanzierungDaten, KostenDaten } from "./types";

export interface Betrag {
  n: number;
  leer: boolean;
  ok: boolean;
}

export function parseBetrag(raw: string | null | undefined): Betrag {
  const s = String(raw ?? "").replace(/€|EUR|\s/gi, "");
  if (!s) return { n: 0, leer: true, ok: true };
  if (!/^[\d.,]+$/.test(s)) return { n: 0, leer: false, ok: false };
  let t: string;
  if (s.includes(",")) t = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d+\.\d{1,2}$/.test(s)) t = s;
  else t = s.replace(/\./g, "");
  const n = parseFloat(t);
  if (!isFinite(n)) return { n: 0, leer: false, ok: false };
  return { n, leer: false, ok: true };
}

export function formatBetrag(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Formatiert die Eingabe beim Verlassen des Feldes (wie blur-Handler der Vorlage). */
export function normalisiereBetrag(raw: string): string {
  const p = parseBetrag(raw);
  return p.ok && !p.leer ? formatBetrag(p.n) : raw;
}

export function betrag(raw: string): number {
  return parseBetrag(raw).n;
}

export interface Summen {
  kosten: number;
  oeffentlich: number;
  finanzierung: number;
  differenz: number;
}

export function berechneSummen(k: KostenDaten, f: FinanzierungDaten): Summen {
  const kosten = betrag(k.sach) + betrag(k.honorare) + betrag(k.extern) + betrag(k.eigen);
  const oeffentlich = betrag(f.gemeinde) + betrag(f.landkreis) + betrag(f.land) + betrag(f.sonstige);
  const finanzierung =
    betrag(f.eigenkapital) +
    betrag(f.eigenleistung) +
    betrag(f.einnahmen) +
    oeffentlich +
    betrag(f.weitere) +
    betrag(f.stiftung);
  const differenz = Math.round((finanzierung - kosten) * 100) / 100;
  return { kosten, oeffentlich, finanzierung, differenz };
}

export type Deckung =
  | { art: "leer"; text: string }
  | { art: "ok"; text: string }
  | { art: "warn"; text: string };

export function deckungspruefung(s: Summen): Deckung {
  if (s.kosten === 0 && s.finanzierung === 0) return { art: "leer", text: "Noch keine Beträge eingetragen." };
  if (s.differenz === 0) return { art: "ok", text: "Die Finanzierung deckt die Gesamtkosten." };
  if (s.differenz < 0)
    return { art: "warn", text: `Zur Deckung der Gesamtkosten fehlen noch ${formatBetrag(-s.differenz)} €.` };
  return { art: "warn", text: `Die Finanzierung liegt ${formatBetrag(s.differenz)} € über den Gesamtkosten.` };
}

export function formatIban(v: string): string {
  return v.replace(/\s/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
}

export function formatEuro(n: number | null | undefined): string {
  if (n == null) return "–";
  return `${formatBetrag(n)} €`;
}
