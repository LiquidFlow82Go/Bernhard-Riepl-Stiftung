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

/** Empfänger der Förderung (Schritt 1). */
export type EmpfaengerArt = "organisation" | "oeffentlich" | "privat";

export const EMPFAENGER: { id: EmpfaengerArt; label: string; beispiel: string }[] = [
  { id: "organisation", label: "Gemeinnützige Organisation", beispiel: "z. B. Verein, gGmbH, Stiftung" },
  { id: "oeffentlich", label: "Öffentliche Einrichtung", beispiel: "z. B. Kirchengemeinde, Körperschaft des öffentlichen Rechts" },
  { id: "privat", label: "Privatperson (Einzelfallhilfe)", beispiel: "Unterstützung einer einzelnen Person in einer Notlage" },
];

export const EMPFAENGER_LABEL: Record<EmpfaengerArt, string> = {
  organisation: "Gemeinnützige Organisation",
  oeffentlich: "Öffentliche Einrichtung",
  privat: "Privatperson (Einzelfallhilfe)",
};

export const ART_VORBELEGUNG =
  "Initiativförderung durch die Stiftung (proaktive Unterstützung aufgrund eines identifizierten Bedarfs vor Ort; kein regulärer Projektantrag von außen)";

export const AUSZAHLUNG_VORBELEGUNG =
  "Überweisung auf das offizielle Konto des Durchführungspartners nach Vorlage von Angebot/Rechnung sowie Nachweis der Gemeinnützigkeit";

/** Nachweis der Steuerbegünstigung (Organisation / öffentliche Einrichtung). */
export type SteuerNachweis = "freistellung" | "feststellung60a" | "koerperschaft";

export const STEUER_NACHWEISE: { id: SteuerNachweis; label: string; bescheid: boolean }[] = [
  { id: "freistellung", label: "Freistellungsbescheid / Körperschaftsteuerbescheid des Finanzamts", bescheid: true },
  { id: "feststellung60a", label: "Feststellungsbescheid nach § 60a AO", bescheid: true },
  { id: "koerperschaft", label: "Körperschaft des öffentlichen Rechts (kein Bescheid erforderlich)", bescheid: false },
];

export function brauchtBescheid(n: SteuerNachweis | ""): boolean {
  return STEUER_NACHWEISE.some((s) => s.id === n && s.bescheid);
}

/** Feststehender Vermerk bei Einzelfallhilfe (auch im PDF). */
export const EINZELFALL_VERMERK =
  "Nicht zutreffend – Einzelfallhilfe für eine natürliche Person. Die Stiftung verwirklicht ihren mildtätigen Zweck (§ 53 AO) hier unmittelbar selbst (§ 57 AO).";

export type Beduerftigkeit = "persoenlich" | "wirtschaftlich";

export const BEDUERFTIGKEIT: { id: Beduerftigkeit; label: string }[] = [
  {
    id: "persoenlich",
    label: "persönlich – aufgrund des körperlichen, geistigen oder seelischen Zustands auf die Hilfe anderer angewiesen (§ 53 Nr. 1 AO)",
  },
  { id: "wirtschaftlich", label: "wirtschaftlich (§ 53 Nr. 2 AO)" },
];

/** Arten von Nachweisen der Bedürftigkeit (nur die Art erscheint im PDF). */
export const NACHWEIS_ARTEN = [
  { id: "leistungsbescheid", label: "Leistungsbescheid (z. B. Bürgergeld, Sozialhilfe, Wohngeld)" },
  { id: "traeger", label: "Bestätigung des Sozialleistungsträgers" },
  { id: "einkommen", label: "Einkommensnachweis bzw. Steuerbescheid" },
  { id: "immatrikulation", label: "Immatrikulationsbescheinigung" },
  { id: "ablehnung", label: "Ablehnungsbescheid anderer Förderstellen" },
  { id: "bescheinigung", label: "Ärztliche oder amtliche Bescheinigung" },
  { id: "sonstiges", label: "Sonstiges" },
] as const;

export type NachweisArt = (typeof NACHWEIS_ARTEN)[number]["id"];

export function nachweisArtLabel(id: string | null | undefined): string {
  return NACHWEIS_ARTEN.find((n) => n.id === id)?.label ?? "Nachweis";
}

export const NICHT_VERWANDT_TEXT =
  "Die geförderte Person ist nicht mit dem Stifter oder mit Mitgliedern der Stiftungsorgane verwandt.";

export const VERFLECHTUNG_TEXT =
  "Es bestehen keine persönlichen oder wirtschaftlichen Verflechtungen zu Mitgliedern der Stiftungsorgane.";

export const BELEG_ANGEBOT_TEXT = "Angebot / Kostenvoranschlag und Zuwendungsbestätigung liegen der Akte bei";
export const BELEG_RECHNUNG_TEXT = "Kopie der Anschaffungsrechnung sowie Empfangsbestätigung / Foto liegen vor";

export interface InitiativDaten {
  stammdaten: {
    /** Datum der Initiative, ISO JJJJ-MM-TT */
    datum: string;
    titel: string;
    /** Empfänger der Förderung; leer = noch nicht gewählt */
    empfaengerArt: EmpfaengerArt | "";
    /** Organisation / öffentliche Einrichtung */
    partnerName: string;
    /** Privatperson (Einzelfallhilfe) */
    vorname: string;
    nachname: string;
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
    /** Organisation / öffentliche Einrichtung */
    steuerNachweis: SteuerNachweis | "";
    bescheidDatum: string;
    ergaenzendeHinweise: string;
    keineVerflechtung: boolean;
    verflechtungText: string;
  };
  /** Privatperson (Einzelfallhilfe) – besonders schutzbedürftige Angaben */
  einzelfall: {
    beduerftigkeit: Beduerftigkeit[];
    geprueftAm: string;
    geprueftVon: string;
    nichtVerwandt: boolean;
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
      empfaengerArt: "",
      partnerName: "",
      vorname: "",
      nachname: "",
      partnerTraeger: "",
      ansprechperson: "",
      email: "",
      telefon: "",
      anschrift: "",
      art: ART_VORBELEGUNG,
    },
    zweck: { bereiche: [], begruendung: "", ausgangslage: "" },
    finanzen: { gegenstand: "", betrag: "", angebotVom: "", auszahlung: AUSZAHLUNG_VORBELEGUNG },
    beschluss: {
      datum: "",
      protokoll: "",
      steuerNachweis: "",
      bescheidDatum: "",
      ergaenzendeHinweise: "",
      keineVerflechtung: false,
      verflechtungText: "",
    },
    einzelfall: { beduerftigkeit: [], geprueftAm: "", geprueftVon: "", nichtVerwandt: false },
    abschluss: { belegAngebot: false, belegRechnung: false, geprueftAm: "", kuerzel },
  };
}

/** Ergänzt gespeicherte Daten um später hinzugekommene Felder. */
export function vervollstaendige(d: Partial<InitiativDaten> | null | undefined): InitiativDaten {
  const l = leereInitiative();
  const x = d ?? {};
  const stammdaten = { ...l.stammdaten, ...x.stammdaten };
  // Ältere Initiativen (vor der Empfängerart) waren immer Organisationen
  if (x.stammdaten && !("empfaengerArt" in x.stammdaten)) stammdaten.empfaengerArt = "organisation";
  return {
    stammdaten,
    zweck: { ...l.zweck, ...x.zweck, bereiche: Array.isArray(x.zweck?.bereiche) ? x.zweck!.bereiche : [] },
    finanzen: { ...l.finanzen, ...x.finanzen },
    beschluss: (() => {
      const b = { ...l.beschluss, ...x.beschluss } as InitiativDaten["beschluss"] & { gemeinnuetzigkeit?: string };
      // Früheres Freitextfeld „Gemeinnützigkeit des Partners“ → „Ergänzende Hinweise“
      if (b.gemeinnuetzigkeit?.trim() && !b.ergaenzendeHinweise.trim()) b.ergaenzendeHinweise = b.gemeinnuetzigkeit;
      delete b.gemeinnuetzigkeit;
      return b;
    })(),
    einzelfall: {
      ...l.einzelfall,
      ...x.einzelfall,
      beduerftigkeit: Array.isArray(x.einzelfall?.beduerftigkeit) ? x.einzelfall!.beduerftigkeit : [],
    },
    abschluss: { ...l.abschluss, ...x.abschluss },
  };
}

export type InitiativDokKategorie =
  | "angebot"
  | "gemeinnuetzigkeit"
  | "beduerftigkeit"
  | "beleg_angebot"
  | "beleg_rechnung"
  | "sonstige";

export const INITIATIV_DOK_LABEL: Record<InitiativDokKategorie, string> = {
  angebot: "Kostenvoranschlag / Angebot",
  gemeinnuetzigkeit: "Bescheid zur Steuerbegünstigung",
  beduerftigkeit: "Nachweis der Bedürftigkeit",
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
  /** Nur bei Nachweisen der Bedürftigkeit: Art des Nachweises */
  nachweisArt?: string | null;
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
  /** Listenanzeige: Institution bzw. „Einzelfallhilfe – M. K.“ */
  partnerName: string;
  empfaengerArt: EmpfaengerArt;
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

/** Initialen einer Person, z. B. „M. K.“ */
export function initialenVon(vorname: string, nachname: string): string {
  return [vorname, nachname]
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `${t.charAt(0).toUpperCase()}.`)
    .join(" ");
}

/** Anzeige in Liste und Kopf: bei Privatpersonen nur Initialen. */
export function partnerAnzeige(d: InitiativDaten): string {
  if (d.stammdaten.empfaengerArt === "privat") {
    const i = initialenVon(d.stammdaten.vorname, d.stammdaten.nachname);
    return i ? `Einzelfallhilfe – ${i}` : "Einzelfallhilfe";
  }
  return d.stammdaten.partnerName.trim();
}

/** Voller Name des Empfängers (nur in geschützten Ansichten und im PDF). */
export function empfaengerName(d: InitiativDaten): string {
  const s = d.stammdaten;
  return s.empfaengerArt === "privat" ? `${s.vorname.trim()} ${s.nachname.trim()}`.trim() : s.partnerName.trim();
}

/** Felder, die nur für eine Empfängergruppe gelten (Pfad, Bezeichnung). */
const NUR_INSTITUTION: [string, string][] = [
  ["stammdaten.partnerName", "Name der Institution"],
  ["stammdaten.partnerTraeger", "Träger bzw. Rechtsform"],
  ["stammdaten.ansprechperson", "Ansprechperson"],
];
const NUR_PRIVAT: [string, string][] = [
  ["stammdaten.vorname", "Vorname"],
  ["stammdaten.nachname", "Nachname"],
];

function wert(d: InitiativDaten, pfad: string): unknown {
  return pfad.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], d);
}
function istGefuellt(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "boolean") return v;
  return typeof v === "string" ? v.trim() !== "" : v != null;
}
function gruppe(a: EmpfaengerArt | ""): "institution" | "privat" | "" {
  return a === "privat" ? "privat" : a ? "institution" : "";
}

/** Felder mit Inhalt, die beim Wechsel der Empfängerart ausgeblendet und nicht gespeichert würden. */
export function verworfeneFelder(d: InitiativDaten, neu: EmpfaengerArt): { pfad: string; label: string }[] {
  const alt = gruppe(d.stammdaten.empfaengerArt);
  if (!alt || alt === gruppe(neu)) return [];
  const liste = alt === "institution" ? NUR_INSTITUTION_ALLE() : NUR_PRIVAT_ALLE();
  return liste.filter(([p]) => istGefuellt(wert(d, p))).map(([pfad, label]) => ({ pfad, label }));
}

// Werden in den folgenden Ausbaustufen um Schritt-4-Felder ergänzt.
function NUR_INSTITUTION_ALLE(): [string, string][] {
  return [...NUR_INSTITUTION, ...NUR_INSTITUTION_SCHRITT4];
}
function NUR_PRIVAT_ALLE(): [string, string][] {
  return [...NUR_PRIVAT, ...NUR_PRIVAT_SCHRITT4];
}
const NUR_INSTITUTION_SCHRITT4: [string, string][] = [
  ["beschluss.steuerNachweis", "Nachweis der Steuerbegünstigung"],
  ["beschluss.bescheidDatum", "Datum des Bescheids"],
  ["beschluss.ergaenzendeHinweise", "Ergänzende Hinweise"],
];
const NUR_PRIVAT_SCHRITT4: [string, string][] = [
  ["einzelfall.beduerftigkeit", "Art der Bedürftigkeit"],
  ["einzelfall.geprueftAm", "Bedürftigkeit geprüft am"],
  ["einzelfall.nichtVerwandt", "Bestätigung „nicht verwandt“"],
];

/** Setzt die Empfängerart; Felder der anderen Gruppe werden geleert. */
export function wendeEmpfaengerAn(d: InitiativDaten, neu: EmpfaengerArt): InitiativDaten {
  const n: InitiativDaten = structuredClone(d);
  const alt = gruppe(d.stammdaten.empfaengerArt);
  n.stammdaten.empfaengerArt = neu;
  // Öffentliche Einrichtung: „Körperschaft des öffentlichen Rechts“ vorbelegen
  if (neu === "oeffentlich" && !n.beschluss.steuerNachweis) n.beschluss.steuerNachweis = "koerperschaft";
  if (alt && alt !== gruppe(neu)) {
    for (const [p] of alt === "institution" ? NUR_INSTITUTION_ALLE() : NUR_PRIVAT_ALLE()) {
      const teile = p.split(".");
      const ziel = teile.slice(0, -1).reduce<Record<string, unknown>>((o, k) => o[k] as Record<string, unknown>, n as unknown as Record<string, unknown>);
      const v = ziel[teile[teile.length - 1]];
      ziel[teile[teile.length - 1]] = Array.isArray(v) ? [] : typeof v === "boolean" ? false : "";
    }
  }
  return n;
}
