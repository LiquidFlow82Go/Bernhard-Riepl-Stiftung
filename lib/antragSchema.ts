/**
 * Zentrales Validierungsschema für den Förderantrag.
 *
 * Pflichtfelder sind noch nicht endgültig festgelegt. Um ein Feld zur Pflicht
 * zu machen, genügt ein Eintrag in PFLICHTFELDER – Formular, Fehlermeldungen
 * und Fehlerübersicht richten sich automatisch danach.
 */
import { z } from "zod";
import { parseBetrag } from "./betrag";
import type { AntragDaten } from "./types";

export type FeldPfad = string; // z. B. "antragsteller.name"

export interface FeldRegel {
  pfad: FeldPfad;
  label: string;
  schritt: 1 | 2 | 3 | 4 | 5 | 6;
  schema: z.ZodTypeAny;
}

const pflichtText = (label: string) =>
  z.string().trim().min(1, `Bitte geben Sie „${label}“ an.`);

const betragGroesserNull = (label: string) =>
  z.string().refine((v) => {
    const p = parseBetrag(v);
    return p.ok && !p.leer && p.n > 0;
  }, `Bitte geben Sie „${label}“ als Betrag größer 0 an.`);

/** Vorläufige Pflichtfelder (Phase 1). */
export const PFLICHTFELDER: FeldRegel[] = [
  { pfad: "antragsteller.name", label: "Name des Antragstellers", schritt: 1, schema: pflichtText("Name des Antragstellers") },
  {
    pfad: "antragsteller.email",
    label: "E-Mail",
    schritt: 1,
    schema: z.string().trim().min(1, "Bitte geben Sie eine E-Mail-Adresse an.").email("Bitte geben Sie eine gültige E-Mail-Adresse an, z. B. name@verein.de."),
  },
  { pfad: "projekt.titel", label: "Projekttitel", schritt: 2, schema: pflichtText("Projekttitel") },
  {
    pfad: "finanzierung.stiftung",
    label: "Beantragte Förderung (Bernhard Riepl Stiftung)",
    schritt: 4,
    schema: betragGroesserNull("Beantragte Förderung"),
  },
  {
    pfad: "bestaetigung",
    label: "Bestätigung der Richtigkeit",
    schritt: 6,
    schema: z.literal(true, { error: "Bitte bestätigen Sie die Richtigkeit Ihrer Angaben." }),
  },
  {
    pfad: "datenschutz",
    label: "Datenschutzhinweis",
    schritt: 6,
    schema: z.literal(true, { error: "Bitte bestätigen Sie den Datenschutzhinweis." }),
  },
];

/** Formatprüfungen für optionale Felder (nur wenn ausgefüllt). */
const BETRAGSFELDER: { pfad: FeldPfad; label: string }[] = [
  ["kosten.sach", "Sachkosten"],
  ["kosten.honorare", "Honorare"],
  ["kosten.extern", "Externe Projektleiter"],
  ["kosten.eigen", "Eigene Personalkosten"],
  ["finanzierung.eigenkapital", "Eigenkapital"],
  ["finanzierung.eigenleistung", "Eigenleistung"],
  ["finanzierung.einnahmen", "Zu erwartende Einnahmen"],
  ["finanzierung.gemeinde", "Gemeinde / Stadt"],
  ["finanzierung.landkreis", "Landkreis"],
  ["finanzierung.land", "Land / Bund"],
  ["finanzierung.sonstige", "Sonstige"],
  ["finanzierung.weitere", "Weitere Mittel"],
].map(([pfad, label]) => ({ pfad, label }));

export function wertAnPfad(daten: AntragDaten, pfad: FeldPfad): unknown {
  return pfad.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], daten);
}

export function istPflicht(pfad: FeldPfad): boolean {
  return PFLICHTFELDER.some((r) => r.pfad === pfad);
}

export type Fehler = Record<FeldPfad, string>;

export function validiere(daten: AntragDaten, nurSchritt?: number): Fehler {
  const fehler: Fehler = {};
  for (const r of PFLICHTFELDER) {
    if (nurSchritt && r.schritt !== nurSchritt) continue;
    const res = r.schema.safeParse(wertAnPfad(daten, r.pfad));
    if (!res.success) fehler[r.pfad] = res.error.issues[0]?.message ?? "Ungültige Eingabe.";
  }
  if (!nurSchritt || nurSchritt === 4) {
    for (const b of BETRAGSFELDER) {
      if (fehler[b.pfad]) continue;
      const p = parseBetrag(String(wertAnPfad(daten, b.pfad) ?? ""));
      if (!p.ok) fehler[b.pfad] = `„${b.label}“: Bitte nur Ziffern, Punkt und Komma verwenden, z. B. 1.250,00.`;
    }
    const st = String(wertAnPfad(daten, "finanzierung.stiftung") ?? "");
    if (!fehler["finanzierung.stiftung"] && !parseBetrag(st).ok)
      fehler["finanzierung.stiftung"] = "„Beantragte Förderung“: Bitte nur Ziffern, Punkt und Komma verwenden.";
  }
  if (!nurSchritt || nurSchritt === 1) {
    const web = String(wertAnPfad(daten, "antragsteller.web") ?? "").trim();
    if (web && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(web))
      fehler["antragsteller.web"] = "Bitte geben Sie eine gültige Internet-Adresse an, z. B. www.verein.de.";
  }
  if (!nurSchritt || nurSchritt === 4) {
    const iban = String(wertAnPfad(daten, "konto.iban") ?? "").replace(/\s/g, "");
    if (iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/i.test(iban))
      fehler["konto.iban"] = "Die IBAN hat nicht das erwartete Format, z. B. DE12 3456 7890 1234 5678 90.";
  }
  return fehler;
}

export function labelFuer(pfad: FeldPfad): string {
  return (
    PFLICHTFELDER.find((r) => r.pfad === pfad)?.label ??
    BETRAGSFELDER.find((r) => r.pfad === pfad)?.label ??
    pfad
  );
}

/** HTML-ID eines Formularfelds aus seinem Pfad. */
export function feldId(pfad: FeldPfad): string {
  return "f-" + pfad.replace(/\./g, "-");
}

/* ---------- Auth-Formulare ---------- */

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Bitte geben Sie Ihre E-Mail-Adresse an.").email("Bitte geben Sie eine gültige E-Mail-Adresse an."),
  passwort: z.string().min(1, "Bitte geben Sie Ihr Passwort ein."),
});

export const registrierenSchema = z
  .object({
    name: z.string().trim().min(1, "Bitte geben Sie Ihren Namen an."),
    institution: z.string().trim().min(1, "Bitte geben Sie den Namen Ihrer Institution an."),
    email: z.string().trim().min(1, "Bitte geben Sie Ihre E-Mail-Adresse an.").email("Bitte geben Sie eine gültige E-Mail-Adresse an."),
    passwort: z.string().min(10, "Das Passwort muss mindestens 10 Zeichen lang sein."),
    passwort2: z.string().min(1, "Bitte wiederholen Sie das Passwort."),
    datenschutz: z.literal(true, { error: "Bitte bestätigen Sie den Datenschutzhinweis." }),
  })
  .refine((d) => d.passwort === d.passwort2, { path: ["passwort2"], message: "Die Passwörter stimmen nicht überein." });

export const passwortVergessenSchema = z.object({
  email: z.string().trim().min(1, "Bitte geben Sie Ihre E-Mail-Adresse an.").email("Bitte geben Sie eine gültige E-Mail-Adresse an."),
});

export function zodFehler(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
