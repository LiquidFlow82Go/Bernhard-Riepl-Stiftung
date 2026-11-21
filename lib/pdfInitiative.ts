/**
 * PDF „Interne Projektdokumentation – Initiativförderung“ nach der Vorlage:
 * Kopf mit Logo auf dunkelblauem Balken, fünf Abschnitte als zweispaltige
 * Tabellen (Merkmal | Angaben), Kästchen bei der Belegprüfung,
 * Unterschriftszeilen und Fußzeile auf jeder Seite.
 * Leere Angaben erscheinen als Linien zum handschriftlichen Ausfüllen.
 */
import { formatBetrag, parseBetrag } from "./betrag";
import {
  BELEG_ANGEBOT_TEXT,
  BELEG_RECHNUNG_TEXT,
  SATZUNGSZWECKE,
  VERFLECHTUNG_TEXT,
  leereInitiative,
  type InitiativDaten,
} from "./initiativeTypen";
import { clean, datumTT, FARBEN, ladeLogo, Zeichner } from "./pdfBasis";

export interface InitiativPdfEingabe {
  daten: InitiativDaten;
  aktenzeichen?: string;
}

const LH = 4.3; // Zeilenhöhe Text
const LINIE = 6.2; // Abstand leerer Ausfülllinien

type Inhalt = { hoehe: (b: number) => number; zeichne: (x: number, y: number, b: number) => void };

export async function erzeugeInitiativPdf(e: InitiativPdfEingabe): Promise<Blob> {
  const [{ jsPDF }, logo] = await Promise.all([import("jspdf"), ladeLogo("hell")]);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setLineHeightFactor(1.3);
  const PW = 210, PH = 297, M = 18, CW = PW - 2 * M;
  const z = new Zeichner(doc, { M, CW, TOP: 20, BOT: PH - 24 });
  const d = e.daten;
  const az = e.aktenzeichen?.trim() || "";

  /* ---------- Inhaltsbausteine (rechte Spalte) ---------- */

  const text = (t: string | null | undefined, leerZeilen = 1): Inhalt => {
    const v = (t ?? "").trim();
    return {
      hoehe: (b) => {
        if (!v) return leerZeilen * LINIE;
        z.schrift(9.5);
        return z.umbrechen(v, b).length * LH;
      },
      zeichne: (x, y, b) => {
        if (!v) {
          for (let i = 1; i <= leerZeilen; i++) z.ausfuelllinie(x, y + i * LINIE - 1.2, b);
          return;
        }
        z.schrift(9.5);
        doc.text(z.umbrechen(v, b), x, y + 3.4);
      },
    };
  };

  /** Fließtext mit eingebetteten Feldern: Wert oder Ausfülllinie. */
  type Teil = string | { wert: string; breite: number };
  const inline = (teile: Teil[]): Inhalt => {
    const ZH = 5.3;
    const layout = (b: number) => {
      z.schrift(9.5);
      const tokens: { art: "wort" | "feld"; t: string; w: number }[] = [];
      for (const p of teile) {
        if (typeof p === "string") {
          for (const w of clean(p).split(/(\s+)/).filter((x) => x.length)) tokens.push({ art: "wort", t: w, w: doc.getTextWidth(w) });
        } else {
          const v = clean(p.wert.trim());
          tokens.push({ art: "feld", t: v, w: v ? doc.getTextWidth(v) : p.breite });
        }
      }
      const pos: { art: "wort" | "feld"; t: string; x: number; zeile: number; w: number }[] = [];
      const leer = doc.getTextWidth(" ");
      let x = 0, zeile = 0, vorher: (typeof tokens)[number] | null = null;
      for (const t of tokens) {
        if (t.art === "wort" && /^\s+$/.test(t.t)) {
          if (x > 0) x += t.w;
          vorher = t;
          continue;
        }
        // Zwischen Text und Feld immer ein Leerzeichen, außer vor schließender Klammer/Satzzeichen
        const nachLeer = vorher && vorher.art === "wort" && /^\s+$/.test(vorher.t);
        if (x > 0 && !nachLeer && (t.art === "feld" || vorher?.art === "feld") && !/^[).,;:]/.test(t.t)) x += leer;
        if (x + t.w > b && x > 0) { zeile++; x = 0; }
        pos.push({ ...t, x, zeile });
        x += t.w;
        vorher = t;
      }
      return { pos, zeilen: zeile + 1 };
    };
    return {
      hoehe: (b) => layout(b).zeilen * ZH,
      zeichne: (x, y, b) => {
        const { pos } = layout(b);
        for (const p of pos) {
          const by = y + 3.6 + p.zeile * ZH;
          if (p.art === "feld" && !p.t) z.ausfuelllinie(x + p.x, by + 0.9, p.w);
          else {
            z.schrift(9.5, p.art === "feld" ? "bold" : "normal");
            doc.text(p.t, x + p.x, by);
          }
        }
      },
    };
  };

  /** Kästchenliste, optional mit Text darunter. */
  const kaestchen = (punkte: { an: boolean; text: string }[], danach?: Inhalt): Inhalt => {
    const hoeheListe = (b: number) => {
      z.schrift(9.5);
      return punkte.reduce((h, p) => h + z.umbrechen(p.text, b - 6).length * LH + 1.6, 0);
    };
    return {
      hoehe: (b) => hoeheListe(b) + (danach ? 2 + danach.hoehe(b) : 0),
      zeichne: (x, y, b) => {
        let yy = y;
        for (const p of punkte) {
          z.kaestchen(x, yy + 0.6, p.an);
          z.schrift(9.5);
          const l = z.umbrechen(p.text, b - 6);
          doc.text(l, x + 6, yy + 3.4);
          yy += l.length * LH + 1.6;
        }
        if (danach) danach.zeichne(x, yy + 2, b);
      },
    };
  };

  const folge = (...teile: Inhalt[]): Inhalt => ({
    hoehe: (b) => teile.reduce((h, t, i) => h + t.hoehe(b) + (i ? 2.5 : 0), 0),
    zeichne: (x, y, b) => {
      let yy = y;
      teile.forEach((t, i) => {
        if (i) yy += 2.5;
        t.zeichne(x, yy, b);
        yy += t.hoehe(b);
      });
    },
  });

  const kopf = (links: string, rechts: string) =>
    z.zeile(links, {
      hoehe: () => LH,
      zeichne: (x, y) => {
        z.schrift(9.5, "bold");
        doc.text(clean(rechts), x, y + 3.4);
      },
    }, true);

  const betrag = (() => {
    const p = parseBetrag(d.finanzen.betrag);
    return p.ok && !p.leer && p.n > 0 ? formatBetrag(p.n) : "";
  })();

  /* ---------- Kopf (erste Seite) ---------- */

  doc.setFillColor(...FARBEN.navy);
  doc.rect(0, 0, PW, 26, "F");
  if (logo) doc.addImage(logo, "PNG", M, 3.5, 33, 18.9, "logo-hell", "FAST");
  z.schrift(9, "normal", [255, 255, 255]);
  doc.text("Interne Projektdokumentation", PW - M, 11.5, { align: "right" });
  z.schrift(11, "bold", [255, 255, 255]);
  doc.text(az ? `Az. ${az}` : "Az. ______________", PW - M, 17.5, { align: "right" });

  z.y = 36;
  z.schrift(19, "bold", FARBEN.navy, "times");
  doc.text(clean("Interne Projektdokumentation: Initiativförderung"), M, z.y);
  z.y += 6;
  z.schrift(10, "normal", FARBEN.grau);
  doc.text(clean("Nachweis zur Mittelverwendung und Zweckbindung (kein regulärer Fremdantrag)"), M, z.y);
  z.y += 4.5;
  doc.setDrawColor(...FARBEN.navy);
  doc.setLineWidth(0.8);
  doc.line(M, z.y, M + CW, z.y);
  z.y += 3;

  /* ---------- 1. Projekt-Stammdaten ---------- */

  const S = d.stammdaten;
  z.abschnitt("1. Projekt-Stammdaten");
  kopf("Merkmal", "Angaben zum Fördervorhaben");
  z.zeile("Aktenzeichen / Datum", inline(["Az.:", { wert: az, breite: 30 }, "   Datum:", { wert: datumTT(S.datum), breite: 30 }]));
  z.zeile("Projekttitel", text(S.titel, 2));
  const partner = [
    S.partnerName.trim() + (S.partnerTraeger.trim() ? ` (${S.partnerTraeger.trim()})` : ""),
    S.ansprechperson.trim() ? `Ansprechperson: ${S.ansprechperson.trim()}` : "",
    [S.email.trim(), S.telefon.trim()].filter(Boolean).join(" / "),
    S.anschrift.trim(),
  ].filter(Boolean).join("\n");
  z.zeile("Durchführungspartner", text(partner, 3));
  z.zeile("Art der Initiative", text(S.art, 2));

  /* ---------- 2. Zweckbindung & Bedarfsbegründung ---------- */

  const Zw = d.zweck;
  z.abschnitt("2. Zweckbindung & Bedarfsbegründung");
  kopf("Prüfpunkt", "Begründung & Einordnung");
  z.zeile(
    "Bezug zum Stiftungszweck",
    kaestchen(
      SATZUNGSZWECKE.map((s) => ({ an: Zw.bereiche.includes(s.id), text: `${s.label} (§ 2 der Satzung)` })),
      text(Zw.begruendung, 2),
    ),
  );
  z.zeile("Ausgangslage & Zielsetzung", text(Zw.ausgangslage, 4));

  /* ---------- 3. Finanzen & Mittelverwendung ---------- */

  const F = d.finanzen;
  z.abschnitt("3. Finanzen & Mittelverwendung");
  kopf("Position", "Festlegung");
  z.zeile("Fördergegenstand", text(F.gegenstand, 2));
  z.zeile(
    "Förderbetrag & Grundlage",
    inline(["EUR", { wert: betrag, breite: 30 }, "(gemäß Kostenvoranschlag / Angebot vom", { wert: datumTT(F.angebotVom), breite: 28 }, ")"]),
  );
  z.zeile("Auszahlungsmodalität", text(F.auszahlung, 2));

  /* ---------- 4. Gremienbeschluss & Compliance ---------- */

  const B = d.beschluss;
  z.abschnitt("4. Gremienbeschluss & Compliance-Prüfung");
  kopf("Prüfbereich", "Vermerk");
  z.zeile(
    "Gremienbeschluss",
    inline(["Genehmigt durch Beschluss vom", { wert: datumTT(B.datum), breite: 28 }, "(Protokoll / TOP:", { wert: B.protokoll, breite: 28 }, ")"]),
  );
  const verflechtung = kaestchen(
    [{ an: B.keineVerflechtung, text: VERFLECHTUNG_TEXT }],
    !B.keineVerflechtung && B.verflechtungText.trim() ? text(`Erläuterung: ${B.verflechtungText}`) : undefined,
  );
  z.zeile("Gemeinnützigkeit & Interessenkonflikte", folge(text(B.gemeinnuetzigkeit, 2), verflechtung));

  /* ---------- 5. Abschluss & Verwendungsnachweis ---------- */

  const A = d.abschluss;
  z.abschnitt("5. Abschluss & Verwendungsnachweis (nach Umsetzung)");
  kopf("Nachweis", "Prüfstatus & Ablagevermerk");
  z.zeile(
    "Belegprüfung",
    kaestchen([
      { an: A.belegAngebot, text: BELEG_ANGEBOT_TEXT },
      { an: A.belegRechnung, text: BELEG_RECHNUNG_TEXT },
    ]),
  );
  z.zeile(
    "Abschlussvermerk",
    inline(["Zweckentsprechende Mittelverwendung geprüft am:", { wert: datumTT(A.geprueftAm), breite: 28 }, "  Kürzel:", { wert: A.kuerzel, breite: 24 }]),
  );

  /* ---------- Unterschriften ---------- */

  z.platz(26);
  z.y += 16;
  const halb = (CW - 8) / 2;
  doc.setDrawColor(...FARBEN.navy);
  doc.setLineWidth(0.4);
  doc.line(M, z.y, M + halb, z.y);
  doc.line(M + halb + 8, z.y, M + CW, z.y);
  z.schrift(8.5, "normal", FARBEN.grau);
  doc.text("Ort, Datum / Projektleitung bzw. Vorstand", M, z.y + 4.5);
  doc.text("Ort, Datum / Mitzeichnung Stiftungsrat", M + halb + 8, z.y + 4.5);

  const erstellt = datumTT(new Date().toISOString());
  z.fusszeilen(
    `Bernhard Riepl Stiftung – Interne Projektdokumentation (Initiativförderung)${az ? ` · ${az}` : ""} · Erstellt am ${erstellt}`,
  );
  return doc.output("blob");
}

/** Leeres Formular zum Ausdrucken (Vorbelegungen bleiben, Datumsfelder leer). */
export function leeresInitiativFormular(): InitiativPdfEingabe {
  const d = leereInitiative("");
  d.stammdaten.datum = "";
  return { daten: d };
}

export function initiativPdfDateiname(aktenzeichen: string | undefined, titel: string): string {
  const kurz = clean(titel)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (!aktenzeichen) return "Initiativfoerderung_Formular_leer.pdf";
  return `Initiativfoerderung_${aktenzeichen}${kurz ? `_${kurz}` : ""}.pdf`;
}
