/**
 * Zentrale Typen. Sie entsprechen dem späteren Supabase-Datenmodell
 * (Tabellen: profiles, antraege, dokumente, absagen).
 */

export type Rolle = "antragsteller" | "stiftungsrat" | "admin";

export interface Benutzer {
  id: string;
  email: string;
  name: string;
  institution?: string;
  rolle: Rolle;
}

export type JaNein = "Ja" | "Nein" | "";

export interface AntragstellerDaten {
  name: string;
  telefon: string;
  register: string;
  steuernummer: string;
  strasse: string;
  email: string;
  plzOrt: string;
  web: string;
  vorsitz: string;
  rechtsform: string;
  projektverantwortlich: string;
  ziele: string;
  grundfinanzierung: string;
  vorsteuerInstitution: JaNein;
  vorsteuerProjekt: JaNein;
}

export interface ProjektDaten {
  titel: string;
  zeitraum: string;
  ort: string;
  partner: string;
  kurzbeschreibung: string;
  ziel: string;
  gegenstand: string;
  vorarbeiten: string;
  zielgruppe: string;
  ablauf: string;
}

export interface AnschlussDaten {
  fortsetzung: JaNein;
  sicherung: string;
}

/** Beträge werden als eingegebener Text gespeichert und über lib/betrag.ts gelesen. */
export interface KostenDaten {
  sach: string;
  honorare: string;
  extern: string;
  eigen: string;
}

export interface FinanzierungDaten {
  eigenkapital: string;
  eigenleistung: string;
  einnahmen: string;
  gemeinde: string;
  landkreis: string;
  land: string;
  sonstige: string;
  weitere: string;
  stiftung: string;
}

export interface KontoDaten {
  institut: string;
  iban: string;
  bic: string;
}

export interface AntragDaten {
  antragsteller: AntragstellerDaten;
  projekt: ProjektDaten;
  anschluss: AnschlussDaten;
  kosten: KostenDaten;
  finanzierung: FinanzierungDaten;
  konto: KontoDaten;
  ortDatum: string;
  bestaetigung: boolean;
  datenschutz: boolean;
}

export type DokumentKategorie =
  | "freistellung"
  | "satzung"
  | "vereinsregister"
  | "gemeinnuetzigkeit"
  | "weitere";

export interface Dokument {
  id: string;
  antragId: string;
  kategorie: DokumentKategorie;
  dateiname: string;
  mimeType: string;
  groesse: number;
  hochgeladenAm: string;
  /** In Phase 2: Pfad im Supabase-Storage-Bucket */
  speicherpfad?: string;
}

export type AntragStatus = "eingegangen" | "in_pruefung" | "bewilligt" | "abgelehnt";

export interface Absage {
  grundId: string;
  grundTitel: string;
  betreff: string;
  text: string;
  empfaenger: string;
  datum: string;
}

export interface Antrag {
  id: string;
  nummer: string; // Format JJJJ-NNN
  benutzerId: string;
  eingereichtAm: string; // ISO
  status: AntragStatus;
  bewilligterBetrag?: number | null;
  absage?: Absage | null;
  daten: AntragDaten;
  dokumente: Dokument[];
  /** Bestätigte Konto-Adresse des Antragstellers (Empfänger aller E-Mails) */
  kontoEmail?: string;
  aktualisiertAm: string;
}

export interface MailProtokollEintrag {
  art: "eingang_antragsteller" | "eingang_stiftungsrat" | "absage";
  empfaenger: string;
  zeitpunkt: string;
  erfolgreich: boolean;
  fehler: string | null;
}

export const MAIL_ART_LABEL: Record<MailProtokollEintrag["art"], string> = {
  eingang_antragsteller: "Eingangsbestätigung an Antragsteller",
  eingang_stiftungsrat: "Benachrichtigung Stiftungsrat",
  absage: "Absage",
};

export const STATUS_LABEL: Record<AntragStatus, string> = {
  eingegangen: "Eingegangen",
  in_pruefung: "In Prüfung",
  bewilligt: "Bewilligt",
  abgelehnt: "Abgelehnt",
};

export const DOKUMENT_LABEL: Record<DokumentKategorie, string> = {
  freistellung: "Freistellungsbescheinigung des Finanzamtes",
  satzung: "Satzung",
  vereinsregister: "Vereinsregisterauszug",
  gemeinnuetzigkeit: "Gemeinnützigkeitsbescheinigung",
  weitere: "Weitere Unterlagen",
};

export function leererAntrag(): AntragDaten {
  return {
    antragsteller: {
      name: "",
      telefon: "",
      register: "",
      steuernummer: "",
      strasse: "",
      email: "",
      plzOrt: "",
      web: "",
      vorsitz: "",
      rechtsform: "",
      projektverantwortlich: "",
      ziele: "",
      grundfinanzierung: "",
      vorsteuerInstitution: "",
      vorsteuerProjekt: "",
    },
    projekt: {
      titel: "",
      zeitraum: "",
      ort: "",
      partner: "",
      kurzbeschreibung: "",
      ziel: "",
      gegenstand: "",
      vorarbeiten: "",
      zielgruppe: "",
      ablauf: "",
    },
    anschluss: { fortsetzung: "", sicherung: "" },
    kosten: { sach: "", honorare: "", extern: "", eigen: "" },
    finanzierung: {
      eigenkapital: "",
      eigenleistung: "",
      einnahmen: "",
      gemeinde: "",
      landkreis: "",
      land: "",
      sonstige: "",
      weitere: "",
      stiftung: "",
    },
    konto: { institut: "", iban: "", bic: "" },
    ortDatum: "",
    bestaetigung: false,
    datenschutz: false,
  };
}
