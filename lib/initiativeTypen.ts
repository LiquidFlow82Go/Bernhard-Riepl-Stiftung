/**
 * Initiativförderung („Eigene Initiativen“): Typen, Vorbelegungen, Bezeichnungen.
 * Aufbau nach der Vorlage „Interne Projektdokumentation – Initiativförderung“.
 */

export type InitiativStatus = "entwurf" | "beschlossen" | "ausgezahlt" | "abgeschlossen";

export const INITIATIV_STATUS: InitiativStatus[] = ["entwurf", "beschlossen", "ausgezahlt", "abgeschlossen"];

export const INITIATIV_STATUS_LABEL: Record<InitiativStatus, string> = {
  entwurf: "Entwurf",
  beschlossen: "Beschlossen",
  ausgezahlt: "Ausgezahlt",
  abgeschlossen: "Abgeschlossen",
};

/** Förderbereiche nach § 2 der Satzung (Mehrfachauswahl). */
export const SATZUNGSZWECKE = [
  { id: "kirche", label: "Kirchliche Zwecke" },
  { id: "kultur", label: "Kulturelle und künstlerische Zwecke" },
  { id: "bildung", label: "Bildung" },
  { id: "hilfe", label: "Hilfe für notleidende Menschen" },
] as const;

export const ART_VORBELEGUNG =
  "Initiativförderung durch die Stiftung (proaktive Unterstützung aufgrund eines identifizierten Bedarfs vor Ort; kein regulärer Projektantrag von außen)";

export const AUSZAHLUNG_VORBELEGUNG =
  "Überweisung auf das offizielle Konto des Durchführungspartners nach Vorlage von Angebot/Rechnung sowie Nachweis der Gemeinnützigkeit";

export const VERFLECHTUNG_TEXT =
  "Es bestehen keine persönlichen oder wirtschaftlichen Verflechtungen zu Mitgliedern der Stiftungsorgane.";

export const BELEG_ANGEBOT_TEXT = "Angebot / Kostenvoranschlag und Zuwendungsbestätigung liegen der Akte bei";
export const BELEG_RECHNUNG_TEXT = "Kopie der Anschaffungsrechnung sowie Empfangsbestätigung / Foto liegen vor";

export interface InitiativDaten {
  stammdaten: {
    /** Datum der Initiative, ISO JJJJ-MM-TT */
    datum: string;
    titel: string;
    partnerName: string;
    partnerTraeger: string;
    ansprechperson: string;
    email: string;
    telefon: string;
    anschrift: string;
    art: string;
  };
  zweck: {
    bereiche: string[];
    begruendung: string;
    ausgangslage: string;
  };
  finanzen: {
    gegenstand: string;
    betrag: string;
    /** Kostenvoranschlag / Angebot vom (ISO) */
    angebotVom: string;
    auszahlung: string;
  };
  beschluss: {
    datum: string;
    protokoll: string;
    gemeinnuetzigkeit: string;
    keineVerflechtung: boolean;
    verflechtungText: string;
  };
  abschluss: {
    belegAngebot: boolean;
    belegRechnung: boolean;
    geprueftAm: string;
    kuerzel: string;
  };
}

export function heuteIso(): string {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function leereInitiative(kuerzel = ""): InitiativDaten {
  return {
    stammdaten: {
      datum: heuteIso(),
      titel: "",
      partnerName: "",
      partnerTraeger: "",
      ansprechperson: "",
      email: "",
      telefon: "",
      anschrift: "",
      art: ART_VORBELEGUNG,
    },
    zweck: { bereiche: [], begruendung: "", ausgangslage: "" },
    finanzen: { gegenstand: "", betrag: "", angebotVom: "", auszahlung: AUSZAHLUNG_VORBELEGUNG },
    beschluss: { datum: "", protokoll: "", gemeinnuetzigkeit: "", keineVerflechtung: false, verflechtungText: "" },
    abschluss: { belegAngebot: false, belegRechnung: false, geprueftAm: "", kuerzel },
  };
}

/** Ergänzt gespeicherte Daten um später hinzugekommene Felder. */
export function vervollstaendige(d: Partial<InitiativDaten> | null | undefined): InitiativDaten {
  const l = leereInitiative();
  const x = d ?? {};
  return {
    stammdaten: { ...l.stammdaten, ...x.stammdaten },
    zweck: { ...l.zweck, ...x.zweck, bereiche: Array.isArray(x.zweck?.bereiche) ? x.zweck!.bereiche : [] },
    finanzen: { ...l.finanzen, ...x.finanzen },
    beschluss: { ...l.beschluss, ...x.beschluss },
    abschluss: { ...l.abschluss, ...x.abschluss },
  };
}

export type InitiativDokKategorie = "angebot" | "gemeinnuetzigkeit" | "beleg_angebot" | "beleg_rechnung" | "sonstige";

export const INITIATIV_DOK_LABEL: Record<InitiativDokKategorie, string> = {
  angebot: "Kostenvoranschlag / Angebot",
  gemeinnuetzigkeit: "Nachweis der Gemeinnützigkeit",
  beleg_angebot: "Angebot und Zuwendungsbestätigung",
  beleg_rechnung: "Rechnung und Empfangsbestätigung / Foto",
  sonstige: "Sonstige Unterlagen",
};

export interface InitiativDokument {
  id: string;
  kategorie: InitiativDokKategorie;
  dateiname: string;
  mimeType: string;
  groesse: number;
  speicherpfad: string;
  hochgeladenAm: string;
}

export interface Person {
  name: string;
  email: string;
  kuerzel: string;
}

export interface VerlaufEintrag {
  von: InitiativStatus | null;
  nach: InitiativStatus;
  grund: string | null;
  am: string;
  durch: Person | null;
}

export interface Initiative {
  id: string;
  aktenzeichen: string;
  jahr: number;
  datum: string;
  status: InitiativStatus;
  projektTitel: string;
  partnerName: string;
  foerderbetrag: number | null;
  daten: InitiativDaten;
  erstelltVon: Person | null;
  erstelltVonId: string | null;
  erstelltAm: string;
  aktualisiertAm: string;
  dokumente: InitiativDokument[];
  verlauf: VerlaufEintrag[];
}

/** Anzeigename einer Person: Name, sonst E-Mail. */
export function personName(p: Person | null | undefined): string {
  if (!p) return "–";
  return p.name?.trim() || p.email;
}
