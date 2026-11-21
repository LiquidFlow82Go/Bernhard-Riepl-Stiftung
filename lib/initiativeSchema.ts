/**
 * Zentrales Prüfschema der Initiativförderung – gilt im Formular, in der
 * Detailansicht und serverseitig beim Statuswechsel.
 *
 * Drei Stufen:
 *  - „formular“:   Pflicht zum Weitergehen im Formular (Schritte 1–4)
 *  - „beschluss“:  zusätzlich nötig für den Status „Beschlossen“
 *  - „abschluss“:  nötig für den Status „Abgeschlossen“ (Schritt 5)
 */
import { z } from "zod";
import { parseBetrag } from "./betrag";
import { brauchtBescheid, type InitiativDaten, type InitiativDokKategorie, type InitiativStatus } from "./initiativeTypen";

export type Stufe = "formular" | "beschluss" | "abschluss";

export interface InitiativRegel {
  pfad: string;
  label: string;
  schritt: 1 | 2 | 3 | 4 | 5;
  stufe: Stufe;
  schema: z.ZodTypeAny;
  /** Regel gilt nur, wenn die Bedingung erfüllt ist (z. B. je Empfängerart). */
  wenn?: (d: InitiativDaten) => boolean;
}

const istPrivat = (d: InitiativDaten) => d.stammdaten.empfaengerArt === "privat";
const istInstitution = (d: InitiativDaten) => d.stammdaten.empfaengerArt !== "privat";

const text = (label: string) => z.string().trim().min(1, `Bitte geben Sie „${label}“ an.`);
const datum = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Bitte geben Sie „${label}“ als Datum an.`);
const betrag = (label: string) =>
  z.string().refine((v) => {
    const p = parseBetrag(v);
    return p.ok && !p.leer && p.n > 0;
  }, `Bitte geben Sie „${label}“ als Betrag größer 0 an, z. B. 2.500,00.`);
const haken = (meldung: string) => z.literal(true, { error: meldung });

export const INITIATIV_REGELN: InitiativRegel[] = [
  { pfad: "stammdaten.datum", label: "Datum", schritt: 1, stufe: "formular", schema: datum("Datum") },
  { pfad: "stammdaten.titel", label: "Projekttitel", schritt: 1, stufe: "formular", schema: text("Projekttitel") },
  {
    pfad: "stammdaten.empfaengerArt",
    label: "Empfänger der Förderung",
    schritt: 1,
    stufe: "formular",
    schema: z.enum(["organisation", "oeffentlich", "privat"], { error: "Bitte wählen Sie den Empfänger der Förderung." }),
  },
  { pfad: "stammdaten.partnerName", label: "Name der Institution", schritt: 1, stufe: "formular", schema: text("Name der Institution"), wenn: istInstitution },
  { pfad: "stammdaten.vorname", label: "Vorname", schritt: 1, stufe: "formular", schema: text("Vorname"), wenn: istPrivat },
  { pfad: "stammdaten.nachname", label: "Nachname", schritt: 1, stufe: "formular", schema: text("Nachname"), wenn: istPrivat },
  {
    pfad: "zweck.bereiche",
    label: "Bezug zum Stiftungszweck",
    schritt: 2,
    stufe: "formular",
    schema: z.array(z.string()).min(1, "Bitte wählen Sie mindestens einen Förderbereich nach § 2 der Satzung."),
  },
  { pfad: "zweck.begruendung", label: "Begründung des Bezugs zum Stiftungszweck", schritt: 2, stufe: "formular", schema: text("Begründung") },
  { pfad: "zweck.ausgangslage", label: "Ausgangslage & Zielsetzung", schritt: 2, stufe: "formular", schema: text("Ausgangslage & Zielsetzung") },
  { pfad: "finanzen.gegenstand", label: "Fördergegenstand", schritt: 3, stufe: "formular", schema: text("Fördergegenstand") },
  { pfad: "finanzen.betrag", label: "Förderbetrag", schritt: 3, stufe: "formular", schema: betrag("Förderbetrag") },
  { pfad: "beschluss.datum", label: "Beschluss vom", schritt: 4, stufe: "beschluss", schema: datum("Beschluss vom") },
  // Organisation / öffentliche Einrichtung
  {
    pfad: "beschluss.steuerNachweis",
    label: "Nachweis der Steuerbegünstigung",
    schritt: 4,
    stufe: "beschluss",
    schema: z.enum(["freistellung", "feststellung60a", "koerperschaft"], { error: "Bitte wählen Sie den Nachweis der Steuerbegünstigung." }),
    wenn: istInstitution,
  },
  {
    pfad: "beschluss.bescheidDatum",
    label: "Datum des Bescheids",
    schritt: 4,
    stufe: "beschluss",
    schema: datum("Datum des Bescheids"),
    wenn: (d) => istInstitution(d) && brauchtBescheid(d.beschluss.steuerNachweis),
  },
  // Privatperson (Einzelfallhilfe)
  {
    pfad: "einzelfall.beduerftigkeit",
    label: "Art der Bedürftigkeit",
    schritt: 4,
    stufe: "formular",
    schema: z.array(z.string()).min(1, "Bitte wählen Sie mindestens eine Art der Bedürftigkeit."),
    wenn: istPrivat,
  },
  {
    pfad: "einzelfall.nichtVerwandt",
    label: "Bestätigung „nicht verwandt“",
    schritt: 4,
    stufe: "formular",
    schema: haken("Bitte bestätigen Sie, dass die geförderte Person nicht mit dem Stifter oder Mitgliedern der Stiftungsorgane verwandt ist."),
    wenn: istPrivat,
  },
  { pfad: "einzelfall.geprueftAm", label: "Bedürftigkeit geprüft am", schritt: 4, stufe: "beschluss", schema: datum("Bedürftigkeit geprüft am"), wenn: istPrivat },
  { pfad: "einzelfall.geprueftVon", label: "Bedürftigkeit geprüft von", schritt: 4, stufe: "beschluss", schema: text("geprüft von"), wenn: istPrivat },
  {
    pfad: "abschluss.belegAngebot",
    label: "Belegprüfung Angebot",
    schritt: 5,
    stufe: "abschluss",
    schema: haken("Bitte bestätigen Sie, dass Angebot und Zuwendungsbestätigung der Akte beiliegen."),
  },
  {
    pfad: "abschluss.belegRechnung",
    label: "Belegprüfung Rechnung",
    schritt: 5,
    stufe: "abschluss",
    schema: haken("Bitte bestätigen Sie, dass Rechnung und Empfangsbestätigung / Foto vorliegen."),
  },
  { pfad: "abschluss.geprueftAm", label: "Geprüft am", schritt: 5, stufe: "abschluss", schema: datum("Geprüft am") },
  { pfad: "abschluss.kuerzel", label: "Kürzel", schritt: 5, stufe: "abschluss", schema: text("Kürzel") },
];

export type InitiativFehler = Record<string, string>;

export function wertAn(d: unknown, pfad: string): unknown {
  return pfad.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), d);
}

export function istInitiativPflicht(pfad: string, d?: InitiativDaten): boolean {
  return INITIATIV_REGELN.some((r) => r.pfad === pfad && r.stufe === "formular" && (!d || !r.wenn || r.wenn(d)));
}

/** Pflicht-Uploads für den Beschluss (Pfad „dokument.<kategorie>“). */
const PFLICHT_DOKUMENTE: { kategorie: InitiativDokKategorie; label: string; meldung: string; wenn: (d: InitiativDaten) => boolean }[] = [
  {
    kategorie: "gemeinnuetzigkeit",
    label: "Bescheid zur Steuerbegünstigung (Upload)",
    meldung: "Bitte laden Sie den Bescheid zur Steuerbegünstigung hoch.",
    wenn: (d) => istInstitution(d) && brauchtBescheid(d.beschluss.steuerNachweis),
  },
  {
    kategorie: "beduerftigkeit",
    label: "Nachweis der Bedürftigkeit (Upload)",
    meldung: "Bitte laden Sie mindestens einen Nachweis der Bedürftigkeit hoch.",
    wenn: istPrivat,
  },
];

/** Prüft Regeln; optional nur bestimmte Stufen bzw. einen Schritt. Uploads nur, wenn `dokumente` übergeben wird. */
export function pruefeInitiative(
  d: InitiativDaten,
  o: { stufen?: Stufe[]; schritt?: number; dokumente?: { kategorie: string }[] } = {},
): InitiativFehler {
  const stufen = o.stufen ?? ["formular"];
  const fehler: InitiativFehler = {};
  for (const r of INITIATIV_REGELN) {
    if (!stufen.includes(r.stufe)) continue;
    if (o.schritt && r.schritt !== o.schritt) continue;
    if (r.wenn && !r.wenn(d)) continue;
    const res = r.schema.safeParse(wertAn(d, r.pfad) ?? (r.schema instanceof z.ZodArray ? [] : ""));
    if (!res.success) fehler[r.pfad] = res.error.issues[0]?.message ?? `Bitte prüfen Sie „${r.label}“.`;
  }
  if (stufen.includes("beschluss") && o.dokumente && (!o.schritt || o.schritt === 4)) {
    for (const p of PFLICHT_DOKUMENTE)
      if (p.wenn(d) && !o.dokumente.some((x) => x.kategorie === p.kategorie)) fehler[`dokument.${p.kategorie}`] = p.meldung;
  }
  // Schritt 4: ohne Bestätigung „keine Verflechtungen“ ist eine Erläuterung Pflicht
  if (stufen.includes("formular") && (!o.schritt || o.schritt === 4)) {
    if (!d.beschluss.keineVerflechtung && !d.beschluss.verflechtungText.trim())
      fehler["beschluss.verflechtungText"] =
        "Bitte bestätigen Sie, dass keine Verflechtungen bestehen, oder erläutern Sie die Verflechtung.";
  }
  if (stufen.includes("formular") && (!o.schritt || o.schritt === 1)) {
    const mail = d.stammdaten.email.trim();
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) fehler["stammdaten.email"] = "Bitte geben Sie eine gültige E-Mail-Adresse an.";
  }
  if (stufen.includes("formular") && (!o.schritt || o.schritt === 3)) {
    const ang = d.finanzen.angebotVom;
    if (ang && !/^\d{4}-\d{2}-\d{2}$/.test(ang)) fehler["finanzen.angebotVom"] = "Bitte geben Sie das Datum des Angebots an.";
  }
  return fehler;
}

/** Welche Stufen ein Ziel-Status verlangt. */
export function stufenFuer(status: InitiativStatus): Stufe[] {
  if (status === "abgeschlossen") return ["formular", "beschluss", "abschluss"];
  if (status === "beschlossen" || status === "ausgezahlt") return ["formular", "beschluss"];
  return [];
}

/** Fehlende Angaben für einen Statuswechsel (leer = möglich). */
export function fehltFuerStatus(d: InitiativDaten, status: InitiativStatus, dokumente: { kategorie: string }[]): InitiativFehler {
  const stufen = stufenFuer(status);
  return stufen.length ? pruefeInitiative(d, { stufen, dokumente }) : {};
}

export function regelLabel(pfad: string): string {
  const dok = PFLICHT_DOKUMENTE.find((p) => `dokument.${p.kategorie}` === pfad);
  if (dok) return dok.label;
  if (pfad === "beschluss.verflechtungText") return "Verflechtungen";
  if (pfad === "stammdaten.email") return "E-Mail";
  if (pfad === "finanzen.angebotVom") return "Angebot vom";
  return INITIATIV_REGELN.find((r) => r.pfad === pfad)?.label ?? pfad;
}

export function regelSchritt(pfad: string): number {
  if (pfad.startsWith("dokument.")) return 4;
  if (pfad === "beschluss.verflechtungText") return 4;
  if (pfad === "stammdaten.email") return 1;
  if (pfad === "finanzen.angebotVom") return 3;
  return INITIATIV_REGELN.find((r) => r.pfad === pfad)?.schritt ?? 1;
}

/** HTML-ID eines Feldes. */
export function initiativFeldId(pfad: string): string {
  return "i-" + pfad.replace(/\./g, "-");
}
