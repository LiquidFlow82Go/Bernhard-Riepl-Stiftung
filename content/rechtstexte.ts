/**
 * Rechtstexte.
 * Haftungsausschluss: Wortlaut aus den „Stiftungseckdaten“.
 * Impressum und Datenschutz: Entwürfe. Angaben in [eckigen Klammern] sind
 * Platzhalter und werden auf der Seite sichtbar markiert. Vor dem Livegang
 * rechtlich prüfen lassen.
 */

export interface RechtsAbschnitt {
  titel?: string;
  absaetze?: string[];
  liste?: string[];
  unter?: RechtsAbschnitt[];
}

export interface Rechtstext {
  titel: string;
  stand: string;
  einleitung?: string;
  abschnitte: RechtsAbschnitt[];
}

export const IMPRESSUM: Rechtstext = {
  titel: "Impressum",
  stand: "Entwurf, November 2026",
  abschnitte: [
    {
      titel: "Angaben gemäß § 5 DDG",
      absaetze: [
        "Bernhard Riepl Stiftung\nStiftung des bürgerlichen Rechts\nStadlbergstraße 56\n83714 Miesbach",
      ],
    },
    {
      titel: "Vertreten durch",
      absaetze: [
        "Den Stiftungsvorstand: [Namen der Vorstandsmitglieder]. Die Mitglieder des Stiftungsvorstands sind einzelvertretungsberechtigt.",
      ],
    },
    {
      titel: "Kontakt",
      absaetze: ["Telefon: [Telefonnummer]\nE-Mail: [E-Mail-Adresse]"],
    },
    {
      titel: "Stiftungsaufsicht",
      absaetze: ["[Zuständige Stiftungsaufsichtsbehörde, z. B. Regierung von Oberbayern – bitte prüfen]"],
    },
    {
      titel: "Steuerliche Angaben",
      absaetze: [
        "Die Stiftung ist als gemeinnützig und mildtätig anerkannt. Zuständiges Finanzamt: [Finanzamt], Steuernummer: [Steuernummer].",
      ],
    },
    {
      titel: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
      absaetze: ["[Name], Stadlbergstraße 56, 83714 Miesbach"],
    },
    {
      titel: "Bildnachweis",
      absaetze: ["Fotos: [Fotograf/in bzw. Bernhard Riepl Stiftung]"],
    },
    {
      titel: "Gestaltung und Umsetzung",
      absaetze: ["[Name der Agentur bzw. Person]"],
    },
  ],
};

export const DATENSCHUTZ: Rechtstext = {
  titel: "Datenschutzerklärung",
  stand: "Entwurf, November 2026",
  einleitung:
    "Mit dieser Datenschutzerklärung informieren wir Sie gemäß Art. 13 und 14 DS-GVO darüber, welche personenbezogenen Daten wir beim Besuch dieser Website und bei der Antragstellung verarbeiten.",
  abschnitte: [
    {
      titel: "1. Verantwortlicher",
      absaetze: [
        "Bernhard Riepl Stiftung, Stadlbergstraße 56, 83714 Miesbach\nE-Mail: [E-Mail-Adresse], Telefon: [Telefonnummer]",
        "Einen Datenschutzbeauftragten hat die Stiftung [nicht benannt / benannt: Name, Kontakt].",
      ],
    },
    {
      titel: "2. Aufruf der Website und Server-Logdateien",
      absaetze: [
        "Beim Aufruf der Website verarbeitet unser Hosting-Anbieter technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser und Betriebssystem). Die Verarbeitung erfolgt zur Bereitstellung und Sicherheit der Website auf Grundlage von Art. 6 Abs. 1 lit. f DS-GVO.",
        "Hosting: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. Mit Vercel besteht ein Vertrag zur Auftragsverarbeitung; die Übermittlung in die USA erfolgt auf Grundlage des EU-U.S. Data Privacy Framework bzw. von Standardvertragsklauseln. [Bitte vor Livegang prüfen.]",
      ],
    },
    {
      titel: "3. Cookies und lokaler Speicher",
      absaetze: [
        "Wir verwenden ausschließlich technisch notwendige Cookies bzw. Einträge im lokalen Speicher Ihres Browsers: zur Anmeldung im Kundenbereich, zum Zwischenspeichern Ihres Antragsentwurfs (ohne Kontoverbindung) und um zu speichern, dass Sie den Cookie-Hinweis gelesen haben. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG in Verbindung mit Art. 6 Abs. 1 lit. b und f DS-GVO. Analyse- oder Marketing-Cookies setzen wir nicht ein.",
      ],
    },
    {
      titel: "4. Schriftarten",
      absaetze: [
        "Die verwendeten Schriften (Outfit, DM Sans) werden von unserem eigenen Server ausgeliefert. Es findet keine Verbindung zu Servern von Google statt.",
      ],
    },
    {
      titel: "5. Benutzerkonto",
      absaetze: [
        "Für die Antragstellung legen Sie ein Benutzerkonto an. Dabei verarbeiten wir Name, Institution, E-Mail-Adresse und ein verschlüsselt gespeichertes Passwort zur Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DS-GVO).",
        "Anmeldung, Datenbank und Dokumentenspeicher werden von Supabase Inc. betrieben; die Daten liegen in einem Rechenzentrum in Frankfurt am Main (EU). Mit Supabase besteht ein Vertrag zur Auftragsverarbeitung. [Bitte vor Livegang prüfen.]",
      ],
    },
    {
      titel: "6. Förderantrag und hochgeladene Dokumente",
      absaetze: [
        "Ihre Daten im Antrag auf Förderung (Förderantrag) werden ausschließlich zur Bearbeitung Ihrer Anfrage elektronisch gespeichert. Alle mit der Verarbeitung der Daten betrauten Firmen und deren Mitarbeiter haben die Verpflichtung auf das Datengeheimnis gemäß den Regelungen des Art. 5 DS-GVO unterzeichnet.",
        "Verarbeitet werden die Angaben im Formular (Institution, Ansprechpersonen, Projekt, Finanzierung, Kontoverbindung) sowie die hochgeladenen Nachweise. Zugriff haben nur die Mitglieder des Stiftungsrats und des Stiftungsvorstands. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DS-GVO.",
        "Die Daten werden gelöscht, sobald sie für die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten (insbesondere nach Abgabenordnung, bis zu 10 Jahre bei bewilligten Förderungen) entgegenstehen. [Löschfristen bitte festlegen.]",
      ],
    },
    {
      titel: "7. E-Mail-Kommunikation",
      absaetze: [
        "Eingangsbestätigungen und Entscheidungen zu Ihrem Antrag versenden wir über das E-Mail-Postfach der Stiftung bei [E-Mail-Anbieter, z. B. IONOS SE oder hosting.de GmbH].",
      ],
    },
    {
      titel: "8. Ihre Rechte",
      liste: [
        "Auskunft über Ihre gespeicherten Daten (Art. 15 DS-GVO)",
        "Berichtigung unrichtiger Daten (Art. 16 DS-GVO)",
        "Löschung (Art. 17 DS-GVO) und Einschränkung der Verarbeitung (Art. 18 DS-GVO)",
        "Datenübertragbarkeit (Art. 20 DS-GVO)",
        "Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DS-GVO)",
        "Beschwerde bei einer Aufsichtsbehörde (Art. 77 DS-GVO), z. B. beim Bayerischen Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach",
      ],
    },
    {
      titel: "9. Informationspflichten",
      absaetze: [
        "Die Informationspflichten gemäß Art. 13 DS-GVO sind auf dieser Seite und in den Büroräumen (Empfangsbereich) einzusehen oder per Post zu erhalten.",
      ],
    },
  ],
};

export const HAFTUNGSAUSSCHLUSS: Rechtstext = {
  titel: "Haftungsausschluss",
  stand: "November 2026",
  abschnitte: [
    {
      titel: "Haftung für Inhalte",
      absaetze: [
        "Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr.",
      ],
    },
    {
      titel: "Haftung für Links",
      absaetze: [
        "Diese Website enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb übernehmen wir für diese fremden Inhalte keine Gewähr. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.",
      ],
    },
    {
      titel: "Urheberrecht",
      absaetze: [
        "Die auf dieser Website erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Jede Vervielfältigung, Bearbeitung, Verbreitung oder Verwertung außerhalb der Grenzen des Urheberrechts bedarf der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.",
      ],
    },
  ],
};
