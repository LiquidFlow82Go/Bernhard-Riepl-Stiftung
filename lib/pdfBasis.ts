/**
 * Gemeinsame Bausteine der PDFs (Antrag auf Förderung, Initiativförderung):
 * Zeichenbereinigung für die Standardschriften, Logo, Datumsformat,
 * Abschnittsköpfe, zweispaltige Tabellen, Kästchen und Fußzeilen.
 */
import type { jsPDF } from "jspdf";

const WIN: Record<string, string> = {
  "„": '"', "“": '"', "”": '"', "‚": "'", "‘": "'", "’": "'",
  "–": "-", "—": "-", "…": "...", "€": "EUR", "•": "-", " ": " ", "\t": " ",
};

/** Text für die Standardschriften (WinAnsi) bereinigen. */
export function clean(s: unknown): string {
  const str = String(s ?? "").replace(/\r\n?/g, "\n").replace(/[\u2028\u2029]/g, "\n");
  let o = "";
  for (const ch of str) {
    if (ch === "\n") { o += ch; continue; }
    if (WIN[ch] !== undefined) { o += WIN[ch]; continue; }
    const c = ch.charCodeAt(0);
    if (c < 32 || (c >= 127 && c < 160)) continue;
    if (c <= 255) { o += ch; continue; }
    const b = ch.normalize("NFD").charAt(0);
    o += b && b !== ch && b.charCodeAt(0) <= 255 ? b : "?";
  }
  return o;
}

/** Logo aus public/logo: „dunkel“ für weißes Papier, „hell“ für dunkle Flächen. */
export async function ladeLogo(variante: "dunkel" | "hell"): Promise<Uint8Array | null> {
  try {
    const r = await fetch(`/logo/logo-${variante}.png`);
    if (!r.ok) return null;
    return new Uint8Array(await r.arrayBuffer());
  } catch {
    return null;
  }
}

/** TT.MM.JJJJ aus JJJJ-MM-TT oder ISO-Zeitstempel. */
export function datumTT(iso?: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });
}

export type RGB = [number, number, number];

export const FARBEN = {
  tinte: [15, 11, 8] as RGB,
  grau: [73, 67, 63] as RGB,
  linie: [205, 212, 224] as RGB,
  navy: [28, 63, 115] as RGB,
  kopfHell: [241, 244, 249] as RGB,
  tabelleKopf: [248, 249, 251] as RGB,
};

/** Kleines Zeichenwerkzeug mit Seitenumbruch für Tabellen-Layouts. */
export class Zeichner {
  y: number;
  constructor(
    readonly doc: jsPDF,
    readonly r: { M: number; CW: number; TOP: number; BOT: number },
  ) {
    this.y = r.TOP;
  }

  schrift(groesse: number, stil: "normal" | "bold" = "normal", farbe: RGB = FARBEN.tinte, familie = "helvetica") {
    this.doc.setFont(familie, stil);
    this.doc.setFontSize(groesse);
    this.doc.setTextColor(...farbe);
  }

  /** Neue Seite, wenn weniger als h mm Platz bleiben. */
  platz(h: number) {
    if (this.y + h > this.r.BOT) {
      this.doc.addPage();
      this.y = this.r.TOP;
    }
  }

  umbrechen(text: string, breite: number): string[] {
    return this.doc.splitTextToSize(clean(text), breite) as string[];
  }

  /** Abschnittskopf: heller Balken mit dunkelblauer Kante. */
  abschnitt(titel: string) {
    const { M, CW } = this.r;
    // Kopf, Tabellenkopf und erste Zeile sollen zusammenbleiben
    this.platz(42);
    this.y += 3.5;
    this.doc.setFillColor(...FARBEN.kopfHell);
    this.doc.rect(M, this.y, CW, 8, "F");
    this.doc.setFillColor(...FARBEN.navy);
    this.doc.rect(M, this.y, 1.1, 8, "F");
    this.schrift(10, "bold", FARBEN.navy);
    this.doc.text(clean(titel.toUpperCase()), M + 5, this.y + 5.5, { charSpace: 0.25 });
    this.y += 8;
  }

  /** Zeile einer zweispaltigen Tabelle; rechts zeichnet `inhalt` ab (x, y, breite) und liefert die Höhe. */
  zeile(
    links: string,
    inhalt: { hoehe: (breite: number) => number; zeichne: (x: number, y: number, breite: number) => void },
    kopf = false,
  ) {
    const { M, CW } = this.r;
    const pad = 2.6, l = CW * 0.5, rb = CW - l;
    this.schrift(9.5, "bold", FARBEN.tinte);
    const lz = this.umbrechen(links, l - 2 * pad);
    const h = Math.max(lz.length * 4.3, inhalt.hoehe(rb - 2 * pad)) + 2 * pad;
    this.platz(h);
    if (kopf) {
      this.doc.setFillColor(...FARBEN.tabelleKopf);
      this.doc.rect(M, this.y, CW, h, "F");
    }
    this.doc.setDrawColor(...FARBEN.linie);
    this.doc.setLineWidth(0.3);
    this.doc.rect(M, this.y, CW, h);
    this.doc.line(M + l, this.y, M + l, this.y + h);
    this.schrift(9.5, "bold", FARBEN.tinte);
    this.doc.text(lz, M + pad, this.y + pad + 3.4);
    inhalt.zeichne(M + l + pad, this.y + pad, rb - 2 * pad);
    this.y += h;
  }

  /** Kästchen (angekreuzt oder leer). */
  kaestchen(x: number, y: number, an: boolean) {
    this.doc.setDrawColor(...FARBEN.grau);
    this.doc.setLineWidth(0.3);
    this.doc.rect(x, y, 3.2, 3.2);
    if (an) {
      this.doc.setDrawColor(...FARBEN.navy);
      this.doc.setLineWidth(0.6);
      this.doc.line(x + 0.6, y + 1.7, x + 1.4, y + 2.6);
      this.doc.line(x + 1.4, y + 2.6, x + 2.8, y + 0.5);
    }
  }

  /** Leere Linie zum handschriftlichen Ausfüllen. */
  ausfuelllinie(x: number, y: number, breite: number) {
    this.doc.setDrawColor(...FARBEN.tinte);
    this.doc.setLineWidth(0.25);
    this.doc.line(x, y, x + breite, y);
  }

  /** Fußzeile auf allen Seiten. */
  fusszeilen(links: string) {
    const { M, CW } = this.r;
    const n = this.doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      this.doc.setPage(i);
      const ph = this.doc.internal.pageSize.getHeight();
      this.doc.setDrawColor(...FARBEN.linie);
      this.doc.setLineWidth(0.3);
      this.doc.line(M, ph - 16, M + CW, ph - 16);
      this.schrift(8, "normal", FARBEN.grau);
      this.doc.text(this.umbrechen(links, CW - 30), M, ph - 11);
      this.doc.text(`Seite ${i} von ${n}`, M + CW, ph - 11, { align: "right" });
    }
  }
}
