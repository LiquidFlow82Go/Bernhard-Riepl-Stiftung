/**
 * Beispieldaten für Phase 1. Werden beim ersten Aufruf in den Browser-Speicher
 * gelegt (siehe lib/mockDb.ts). In Phase 2 entfällt diese Datei.
 */
import { leererAntrag, type Antrag, type AntragDaten, type Benutzer, type Dokument } from "./types";

export const TEST_PASSWORT = "Stiftung2026!";

export const BEISPIEL_BENUTZER: Benutzer[] = [
  {
    id: "u-antragsteller",
    email: "antragsteller@beispiel.de",
    name: "Maria Huber",
    institution: "Kulturverein Miesbacher Land e. V.",
    rolle: "antragsteller",
  },
  {
    id: "u-stiftungsrat",
    email: "stiftungsrat@beispiel.de",
    name: "Dr. Thomas Berger",
    rolle: "stiftungsrat",
  },
  {
    id: "u-kirche",
    email: "pfarramt@beispiel.de",
    name: "Pfarrer Johannes Wimmer",
    institution: "Kath. Kirchenstiftung St. Michael",
    rolle: "antragsteller",
  },
  {
    id: "u-musik",
    email: "info@musikschule-beispiel.de",
    name: "Anna Steiner",
    institution: "Musikschule Oberland gGmbH",
    rolle: "antragsteller",
  },
];

function daten(p: Partial<{
  name: string; email: string; rechtsform: string; ort: string; vorsitz: string;
  titel: string; zeitraum: string; kurz: string; sach: string; honorare: string;
  eigenkapital: string; gemeinde: string; stiftung: string; partner: string;
}>): AntragDaten {
  const d = leererAntrag();
  d.antragsteller = {
    ...d.antragsteller,
    name: p.name ?? "",
    email: p.email ?? "",
    rechtsform: p.rechtsform ?? "e. V.",
    plzOrt: p.ort ?? "83714 Miesbach",
    strasse: "Beispielstraße 1",
    telefon: "08025 000000",
    register: "VR 000000",
    steuernummer: "139/000/00000",
    vorsitz: p.vorsitz ?? "",
    projektverantwortlich: `${p.vorsitz ?? ""}, ${p.email ?? ""}`,
    ziele: "Beispieltext: Förderung des kulturellen Lebens in der Region durch Konzerte, Ausstellungen und Bildungsangebote.",
    grundfinanzierung: "Beispieltext: Mitgliedsbeiträge, Spenden und Zuschüsse der Gemeinde.",
    vorsteuerInstitution: "Nein",
  };
  d.projekt = {
    ...d.projekt,
    titel: p.titel ?? "",
    zeitraum: p.zeitraum ?? "",
    ort: p.ort ?? "Miesbach",
    partner: p.partner ?? "",
    kurzbeschreibung: p.kurz ?? "",
    ziel: "Beispieltext zum Ziel des Projekts.",
    gegenstand: "Beispieltext zum Gegenstand des Projekts.",
    vorarbeiten: "Beispieltext zu Vorarbeiten und Referenzprojekten.",
    zielgruppe: "Etwa 120 Teilnehmende aus dem Landkreis Miesbach, alle Altersgruppen.",
    ablauf: "Vorbereitung, Durchführung, Abschluss und Dokumentation.",
  };
  d.anschluss = { fortsetzung: "Ja", sicherung: "Beispieltext: Eigenmittel und Sponsoring aus der Region." };
  d.kosten = { sach: p.sach ?? "", honorare: p.honorare ?? "", extern: "", eigen: "" };
  d.finanzierung = {
    ...d.finanzierung,
    eigenkapital: p.eigenkapital ?? "",
    gemeinde: p.gemeinde ?? "",
    stiftung: p.stiftung ?? "",
  };
  d.konto = { institut: "Beispielbank Oberland", iban: "DE00 0000 0000 0000 0000 00", bic: "BEISPDEXXX" };
  d.ortDatum = "Miesbach";
  d.bestaetigung = true;
  d.datenschutz = true;
  return d;
}

function dok(antragId: string, kategorie: Dokument["kategorie"], dateiname: string, datum: string): Dokument {
  return {
    id: `${antragId}-${kategorie}`,
    antragId,
    kategorie,
    dateiname,
    mimeType: "application/pdf",
    groesse: 184_320,
    hochgeladenAm: datum,
  };
}

export const BEISPIEL_ANTRAEGE: Antrag[] = [
  {
    id: "a-2025-007",
    nummer: "2025-007",
    benutzerId: "u-antragsteller",
    eingereichtAm: "2025-09-18T09:12:00.000Z",
    aktualisiertAm: "2025-11-03T14:00:00.000Z",
    status: "bewilligt",
    bewilligterBetrag: 4000,
    daten: daten({
      name: "Kulturverein Miesbacher Land e. V.",
      email: "antragsteller@beispiel.de",
      vorsitz: "Maria Huber",
      titel: "Herbstkonzerte im Waitzinger Keller",
      zeitraum: "10/2025 bis 11/2025",
      kurz: "Drei Kammerkonzerte mit jungen Musikerinnen und Musikern aus dem Oberland.",
      sach: "3.200,00",
      honorare: "4.800,00",
      eigenkapital: "2.000,00",
      gemeinde: "2.000,00",
      stiftung: "4.000,00",
    }),
    dokumente: [],
  },
  {
    id: "a-2026-002",
    nummer: "2026-002",
    benutzerId: "u-antragsteller",
    eingereichtAm: "2026-10-02T08:40:00.000Z",
    aktualisiertAm: "2026-10-20T10:00:00.000Z",
    status: "in_pruefung",
    daten: daten({
      name: "Kulturverein Miesbacher Land e. V.",
      email: "antragsteller@beispiel.de",
      vorsitz: "Maria Huber",
      titel: "Ausstellung „Licht im Oberland“",
      zeitraum: "03/2027 bis 05/2027",
      kurz: "Ausstellung regionaler Malerinnen und Maler mit Führungen für Schulklassen.",
      sach: "6.500,00",
      honorare: "2.500,00",
      eigenkapital: "1.500,00",
      gemeinde: "1.500,00",
      stiftung: "6.000,00",
    }),
    dokumente: [],
  },
  {
    id: "a-2026-001",
    nummer: "2026-001",
    benutzerId: "u-kirche",
    eingereichtAm: "2026-08-14T11:05:00.000Z",
    aktualisiertAm: "2026-09-01T09:00:00.000Z",
    status: "eingegangen",
    daten: daten({
      name: "Kath. Kirchenstiftung St. Michael",
      email: "pfarramt@beispiel.de",
      rechtsform: "Kirchenstiftung (KdöR)",
      vorsitz: "Pfarrer Johannes Wimmer",
      titel: "Restaurierung der Seitenaltarfiguren",
      zeitraum: "01/2027 bis 12/2027",
      kurz: "Fachgerechte Restaurierung zweier barocker Holzfiguren.",
      sach: "18.000,00",
      eigenkapital: "8.000,00",
      stiftung: "10.000,00",
    }),
    dokumente: [],
  },
  {
    id: "a-2026-003",
    nummer: "2026-003",
    benutzerId: "u-musik",
    eingereichtAm: "2026-10-28T15:30:00.000Z",
    aktualisiertAm: "2026-11-05T15:30:00.000Z",
    status: "abgelehnt",
    absage: {
      grundId: "zweck",
      grundTitel: "Außerhalb des Stiftungszwecks",
      betreff: "Ihr Förderantrag 2026-003",
      text: "(Beispiel einer versendeten Absage)",
      empfaenger: "info@musikschule-beispiel.de",
      datum: "2026-11-05T15:30:00.000Z",
    },
    daten: daten({
      name: "Musikschule Oberland gGmbH",
      email: "info@musikschule-beispiel.de",
      rechtsform: "gGmbH",
      vorsitz: "Anna Steiner",
      titel: "Neue Bestuhlung für den Unterrichtsraum",
      zeitraum: "01/2027",
      kurz: "Anschaffung von 40 Stühlen für den laufenden Unterrichtsbetrieb.",
      sach: "5.600,00",
      stiftung: "5.600,00",
    }),
    dokumente: [],
  },
];

for (const a of BEISPIEL_ANTRAEGE) {
  a.dokumente = [
    dok(a.id, "freistellung", "Freistellungsbescheid_2025.pdf", a.eingereichtAm),
    dok(a.id, "satzung", "Satzung.pdf", a.eingereichtAm),
  ];
  if (a.daten.antragsteller.rechtsform === "e. V.")
    a.dokumente.push(dok(a.id, "vereinsregister", "Vereinsregisterauszug.pdf", a.eingereichtAm));
}
