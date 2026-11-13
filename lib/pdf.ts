/**
 * PDF des Förderantrags – Layout aus der HTML-Vorlage (buildPdf) übernommen.
 * Neu: Antragsnummer im Kopf jeder Seite und im Stiftungsfeld,
 * elektronische Bestätigung statt Unterschriftszeile.
 */
import { berechneSummen, formatBetrag, parseBetrag } from "./betrag";
import type { AntragDaten } from "./types";

export interface PdfEingabe {
  daten: AntragDaten;
  nummer?: string;
  eingereichtAm?: string;
  bewilligterBetrag?: number | null;
  dokumente?: { kategorie: string; dateiname: string }[];
}

const WIN: Record<string, string> = {
  "„": '"', "“": '"', "”": '"', "‚": "'", "‘": "'", "’": "'",
  "–": "-", "—": "-", "…": "...", "€": "EUR", "•": "-", " ": " ", "\t": " ",
};

function clean(s: unknown): string {
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

function pdfAmt(v: string): string {
  const p = parseBetrag(v);
  return p.leer || !p.ok ? "" : `${formatBetrag(p.n)} EUR`;
}

function datumDe(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function erzeugeAntragPdf(e: PdfEingabe): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const d = e.daten;
  const A = d.antragsteller, P = d.projekt, K = d.kosten, F = d.finanzierung;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setLineHeightFactor(1.3);
  const PW = 210, PH = 297, M = 18, CW = PW - 2 * M, TOP = 34, BOT = PH - 18, GAP = 6;
  type RGB = [number, number, number];
  const INK: RGB = [15, 11, 8], GREY: RGB = [73, 67, 63], RULE: RGB = [150, 145, 140], LIGHT: RGB = [205, 201, 198];
  let y = TOP;

  const font = (size: number, style: "normal" | "bold" = "normal", color: RGB = INK) => {
    doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...color);
  };
  const ensure = (h: number) => { if (y + h > BOT) { doc.addPage(); y = TOP; } };
  const hr = (x1: number, x2: number, yy: number, col: RGB = RULE, w = 0.2) => {
    doc.setDrawColor(...col); doc.setLineWidth(w); doc.line(x1, yy, x2, yy);
  };
  const wrap = (txt: string, w: number, size: number, style: "normal" | "bold" = "normal"): string[] => {
    font(size, style); return doc.splitTextToSize(clean(txt), w);
  };
  const h1 = (t: string) => { ensure(48); y += 4; font(12.5, "bold"); doc.text(clean(t), M, y); y += 7; };
  const h2 = (t: string) => { ensure(34); y += 1; font(10.5, "bold"); doc.text(clean(t), M, y); y += 6; };
  const para = (t: string, size: number) => {
    for (const ln of wrap(t, CW, size)) { ensure(4.2); font(size, "normal", GREY); doc.text(ln, M, y + 3); y += 4; }
    y += 2;
  };
  type Col = { label: string; value: string; w: number };
  const row = (cols: Col[]) => {
    let n = 1;
    const lines = cols.map((c) => { const l = wrap(c.value, c.w - 1, 10); n = Math.max(n, l.length); return l; });
    const h = 3.8 + n * 4.6 + 2.6;
    ensure(h);
    let x = M;
    cols.forEach((c, i) => {
      font(7.5, "normal", GREY); doc.text(clean(c.label), x, y + 2.4);
      font(10); doc.text(lines[i], x, y + 7);
      hr(x, x + c.w, y + h - 1.2);
      x += c.w + GAP;
    });
    y += h;
  };
  const two = (l1: string, v1: string, l2: string, v2: string) => {
    const w = (CW - GAP) / 2; row([{ label: l1, value: v1, w }, { label: l2, value: v2, w }]);
  };
  const one = (l: string, v: string) => row([{ label: l, value: v, w: CW }]);
  const block = (label: string, value: string, minLines = 2) => {
    const ll = wrap(label, CW, 8, "bold");
    const lines = (value || "").trim() ? wrap(value, CW, 10) : [];
    ensure(ll.length * 3.8 + 9);
    font(8, "bold", GREY); doc.text(ll, M, y + 2.6); y += ll.length * 3.8 + 1.4;
    if (lines.length) {
      for (const ln of lines) { ensure(4.7); font(10); doc.text(ln, M, y + 3.6); y += 4.7; }
      y += 1; hr(M, M + CW, y); y += 4;
    } else {
      for (let i = 0; i < minLines; i++) { ensure(6.5); hr(M, M + CW, y + 6); y += 6.5; }
      y += 2;
    }
  };
  const check = (x: number, yy: number, on: boolean) => {
    doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.rect(x, yy, 3.4, 3.4);
    if (on) { doc.setLineWidth(0.5); doc.line(x + 0.7, yy + 0.7, x + 2.7, yy + 2.7); doc.line(x + 2.7, yy + 0.7, x + 0.7, yy + 2.7); }
  };

  /* Stiftungsfeld */
  doc.setFillColor(231, 229, 228); doc.rect(M, y, 96, 17, "F");
  font(7.5, "normal", GREY);
  doc.text("Antragsnr.", M + 2, y + 5.5); hr(M + 2, M + 94, y + 7, RULE);
  if (e.nummer) { font(10, "bold"); doc.text(e.nummer, M + 20, y + 5.6); }
  font(7.5, "normal", GREY);
  doc.text("Prüfvermerk", M + 2, y + 12.5); hr(M + 2, M + 94, y + 14, RULE);
  font(6.5, "normal", GREY); doc.text(clean("wird von der Stiftung ausgefüllt"), M + 94, y + 16.3, { align: "right" });
  if (e.eingereichtAm) {
    font(8.5, "normal", GREY);
    doc.text(`Eingereicht am ${datumDe(e.eingereichtAm)}`, M + CW, y + 5.5, { align: "right" });
  }
  y += 22;

  h1("1  Angaben zum Antragsteller");
  h2("1.1  Bezeichnung der Institution");
  para("Wichtiger Hinweis: Die Bernhard Riepl Stiftung fördert keine Privatpersonen, sondern nur Institutionen, die ihrerseits gemeinnützig tätig sind. Ohne Nachweis über die Steuerbegünstigung (Freistellungsbescheinigung des Finanzamtes) erfolgt keine Bearbeitung des Antrages. Bei Vereinen: bitte Satzung, Vereinsregisterauszug und Gemeinnützigkeitsbescheinigung als Anlage beilegen.", 8);
  two("Name des Antragstellers", A.name, "Telefon / Telefax", A.telefon);
  two("Nummer Handelsregister bzw. Vereinsregister", A.register, "Steuernummer bzw. Freistellungsbescheinigung", A.steuernummer);
  two("Straße, Hausnummer", A.strasse, "E-Mail", A.email);
  two("PLZ / Ort", A.plzOrt, "Internet-Adresse", A.web);
  two("Geschäftsführer(in) / Vorsitzende(r)", A.vorsitz, "Rechtsform", A.rechtsform);
  one("Verantwortlich für die Projektbearbeitung: Name / Telefon / Telefax / E-Mail", A.projektverantwortlich);
  y += 2;
  block("Ziele und Tätigkeit der Institution", A.ziele, 2);
  block("Grundfinanzierung der Institution", A.grundfinanzierung, 2);
  two("Besteht eine Vorsteuerabzugsberechtigung für die Institution?", A.vorsteuerInstitution, "Falls ja: Gilt diese auch für das Projekt?", A.vorsteuerProjekt);

  const kat = new Set((e.dokumente ?? []).map((x) => x.kategorie));
  ensure(36);
  y += 2; font(8, "bold", GREY); doc.text("Beigefügte Anlagen (digital hochgeladen)", M, y + 2.6); y += 6;
  ([
    ["freistellung", "Freistellungsbescheinigung des Finanzamtes"],
    ["satzung", "Satzung"],
    ["vereinsregister", "Vereinsregisterauszug"],
    ["gemeinnuetzigkeit", "Gemeinnützigkeitsbescheinigung"],
    ["weitere", "Weitere Unterlagen"],
  ] as const).forEach(([k, l]) => {
    ensure(6); check(M, y, kat.has(k)); font(10); doc.text(clean(l), M + 6, y + 2.9); y += 6;
  });

  h1("2  Angaben zum Projekt");
  h2("2.1  Kurzbeschreibung");
  one("Projekttitel", P.titel);
  two("Zeitraum", P.zeitraum, "Förderort", P.ort);
  one("Projektpartner", P.partner);
  y += 2;
  block("Kurzbeschreibung des Projektes", P.kurzbeschreibung, 4);
  h2("2.2  Ausführliche Beschreibung des Projekts");
  block("Ziel", P.ziel, 3);
  block("Gegenstand", P.gegenstand, 3);
  block("Eigene Vorarbeiten, Erfahrungsstand, Referenzprojekte", P.vorarbeiten, 3);
  block("Teilnehmer / Zielgruppe (Anzahl, Alter, Herkunft, Auswahlkriterien)", P.zielgruppe, 3);
  block("Projektaufbau und -ablauf, Zeitplan (Skizzieren Sie die wichtigsten Arbeitsschritte und Methoden)", P.ablauf, 4);

  h1("3  Anschlussperspektive");
  one("Soll das Projekt fortgesetzt werden?", d.anschluss.fortsetzung);
  y += 2;
  block("Wenn ja, wie planen Sie die finanzielle, organisatorische und institutionelle Sicherung?", d.anschluss.sicherung, 3);

  if (y > TOP + 2) { doc.addPage(); y = TOP; }
  h1("4  Finanzielle Angaben");
  const XA = M + CW - 42, XB = M + CW;
  const mrow = (label: string, value: string, o: { hint?: string; bold?: boolean; indent?: number; col2?: string } = {}) => {
    const h = o.hint ? 10 : 7;
    ensure(h);
    font(10, o.bold ? "bold" : "normal");
    doc.text(clean(label), M + (o.indent ?? 0), y + 4.4);
    if (o.hint) { font(7, "normal", GREY); doc.text(clean(o.hint), M + (o.indent ?? 0), y + 7.6); }
    if (value) { font(10, o.bold ? "bold" : "normal"); doc.text(clean(value), XA, y + 4.4, { align: "right" }); }
    if (o.col2) { font(10, "bold"); doc.text(clean(o.col2), XB - 1.5, y + 4.4, { align: "right" }); }
    hr(M, M + CW, y + h - 0.6, LIGHT);
    y += h;
  };
  const s = berechneSummen(K, F);
  h2("4.1  Kosten");
  mrow("Sachkosten", pdfAmt(K.sach), { hint: "z. B. Transportkosten, Versicherung, Mieten, Material usw." });
  mrow("Personalkosten:", "", { bold: true });
  mrow("Honorare", pdfAmt(K.honorare), { indent: 5 });
  mrow("Externe Projektleiter", pdfAmt(K.extern), { indent: 5 });
  mrow("Eigene Personalkosten", pdfAmt(K.eigen), { indent: 5 });
  ensure(9); hr(M, M + CW, y + 1, INK, 0.5); y += 1.5;
  mrow("Gesamtkosten", `${formatBetrag(s.kosten)} EUR`, { bold: true });
  y += 4;

  ensure(112);
  h2("4.2  Finanzierung");
  const top0 = y;
  font(8, "bold", GREY);
  doc.text("beantragt", XA, y + 3, { align: "right" });
  doc.text("bewilligt (Stiftung)", XB, y + 3, { align: "right" });
  y += 5;
  mrow("Eigene Mittel:", "", { bold: true });
  mrow("Eigenkapital", pdfAmt(F.eigenkapital), { indent: 5 });
  mrow("Eigenleistung", pdfAmt(F.eigenleistung), { indent: 5 });
  mrow("Zu erwartende Einnahmen", pdfAmt(F.einnahmen));
  mrow("Öffentliche Mittel", `${formatBetrag(s.oeffentlich)} EUR`, { bold: true, hint: "durch Anträge belegen" });
  mrow("Gemeinde / Stadt", pdfAmt(F.gemeinde), { indent: 5 });
  mrow("Landkreis", pdfAmt(F.landkreis), { indent: 5 });
  mrow("Land / Bund", pdfAmt(F.land), { indent: 5 });
  mrow("Sonstige", pdfAmt(F.sonstige), { indent: 5 });
  mrow("Weitere Mittel", pdfAmt(F.weitere), { hint: "z. B. durch Firmen o. ä." });
  mrow("Bernhard Riepl Stiftung", pdfAmt(F.stiftung), {
    col2: e.bewilligterBetrag != null ? `${formatBetrag(e.bewilligterBetrag)} EUR` : undefined,
  });
  hr(M, M + CW, y + 1, INK, 0.5); y += 1.5;
  mrow("Summe", `${formatBetrag(s.finanzierung)} EUR`, { bold: true });
  doc.setDrawColor(...LIGHT); doc.setLineWidth(0.3);
  doc.rect(XB - 36, top0 + 4, 37.5, y - top0 - 4);
  y += 5;

  ensure(48);
  h2("4.3  Kontoverbindung");
  one("Kreditinstitut", d.konto.institut);
  row([
    { label: "IBAN", value: d.konto.iban, w: CW * 0.64 - GAP / 2 },
    { label: "BIC", value: d.konto.bic, w: CW * 0.36 - GAP / 2 },
  ]);
  y += 3;

  ensure(78);
  h2("4.4  Datenschutz und Bestätigung");
  para("Ihre Daten im Antrag auf Förderung (Förderantrag) werden ausschließlich zur Bearbeitung Ihrer Anfrage elektronisch gespeichert. Alle mit der Verarbeitung der Daten betrauten Firmen und deren Mitarbeiter haben die Verpflichtung auf das Datengeheimnis gemäß den Regelungen des Art. 5 DS-GVO unterzeichnet. Die Informationspflichten gemäß Art. 13 DS-GVO sind auf der Homepage unter „Datenschutz“ einzusehen oder per Post zu erhalten.", 8);
  y += 3;
  ensure(6); check(M, y, d.bestaetigung); font(10); doc.text(clean("Der Antragsteller bestätigt die Richtigkeit der Angaben."), M + 6, y + 2.9); y += 6.5;
  ensure(6); check(M, y, d.datenschutz); font(10); doc.text(clean("Der Datenschutzhinweis wurde zur Kenntnis genommen."), M + 6, y + 2.9); y += 8;
  const wl = 62;
  font(10); doc.text(doc.splitTextToSize(clean(d.ortDatum + (e.eingereichtAm ? `, ${datumDe(e.eingereichtAm)}` : "")), wl - 1)[0] || "", M, y + 8);
  font(10); doc.text(clean(e.eingereichtAm ? `Elektronisch eingereicht – ${A.name}` : ""), M + wl + 10, y + 8);
  hr(M, M + wl, y + 10); hr(M + wl + 10, M + CW, y + 10);
  font(7.5, "normal", GREY);
  doc.text("Ort und Datum", M, y + 14);
  doc.text(clean("Bestätigung (ersetzt die Unterschrift)"), M + wl + 10, y + 14);

  const N = doc.getNumberOfPages();
  for (let i = 1; i <= N; i++) {
    doc.setPage(i);
    font(12.5, "bold"); doc.text(clean("Antrag auf Förderung durch die Bernhard Riepl Stiftung"), M, 17);
    font(8.5, "normal", GREY);
    doc.text(e.nummer ? `Antragsnr. ${e.nummer}` : "Entwurf – noch nicht eingereicht", M, 23.5);
    doc.text(`Seite ${i} von ${N}`, PW - M, 23.5, { align: "right" });
    hr(M, M + CW, 26.5, LIGHT, 0.3);
    font(8, "normal", GREY);
    doc.text("Bernhard Riepl Stiftung · Stadlbergstraße 56 · 83714 Miesbach", M, PH - 10);
    doc.text("V 03/2023", PW - M, PH - 10, { align: "right" });
  }
  return doc.output("blob");
}

export function pdfDateiname(nummer: string | undefined, titel: string): string {
  const slug = clean(titel)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `Foerderantrag-${nummer ?? "Entwurf"}${slug ? "-" + slug : ""}.pdf`;
}
