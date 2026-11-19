/** Inhalte der Stiftung – Wortlaut aus den „Stiftungseckdaten“. */

export const STIFTUNG = {
  name: "Bernhard Riepl Stiftung",
  kurzname: "B.R. Stiftung",
  zweckKurz:
    "Förderung kirchlicher, kultureller – insbesondere künstlerischer – Zwecke, der Bildung und Hilfe für notleidende Menschen",
  sitz: "Miesbach, Landkreis Miesbach, Oberbayern",
  anschrift: {
    zeile1: "Bernhard Riepl Stiftung",
    zeile2: "z. Hd. Herrn Bernhard Riepl",
    strasse: "Stadlbergstraße 56",
    ort: "83714 Miesbach",
  },
  // Noch nicht geliefert – im Footer und Kontakt als Platzhalter sichtbar
  telefon: "[Telefonnummer]",
  email: "[E-Mail-Adresse]",
};

export const ECKDATEN: { label: string; wert: string }[] = [
  { label: "Rechtsstellung", wert: "Stiftung des bürgerlichen Rechts" },
  { label: "Art der Stiftung", wert: "allgemeine (nicht-kommunale) Stiftung" },
  { label: "Art der Zwecke", wert: "öffentliche Zwecke" },
  { label: "Sitz", wert: "Miesbach, Landkreis Miesbach, Oberbayern" },
  { label: "Stifter", wert: "Bernhard Riepl" },
  { label: "Errichtet", wert: "11. Dezember 2001" },
  { label: "Stiftungsorgane", wert: "Stiftungsvorstand, Stiftungsrat" },
];

export const VERTRETUNG =
  "Der Stiftungsvorstand vertritt die Stiftung gerichtlich und außergerichtlich. Er hat die Stellung eines gesetzlichen Vertreters. Seine Mitglieder sind einzelvertretungsberechtigt.";

export const STAND = "08.11.2022";

export const PRAEAMBEL: string[] = [
  "Die Familie Riepl ist bereits seit 5 Generationen in Regensburg ansässig. Sie hat es sich zur Aufgabe gemacht, stets auch über den Firmenbereich der Josef Riepl GmbH, Unternehmen für Hoch- und Tiefbau, Regensburg, hinaus zum Wohle der Allgemeinheit zu wirken.",
  "Diese Familientradition soll durch die Errichtung der Bernhard Riepl Stiftung auf Dauer aufrechterhalten werden. Dabei sollen insbesondere auch die in der Familie verwurzelten künstlerischen und kulturellen Fähigkeiten bzw. Neigungen gefördert und gepflegt werden. Der Ertrag des gestifteten Stiftungsvermögens soll noch dadurch erhöht werden, dass entweder zu Lebzeiten des Stifters oder aber nach seinem Ableben weiteres Vermögen im Wege der Zustiftung auf die Bernhard Riepl Stiftung übertragen wird. Auch das durch solche Zustiftung erhöhte Stiftungsvermögen muss – gegebenenfalls unter Ausweitung des Stiftungszweckes – auf Dauer der Stiftung erhalten bleiben.",
];

export interface Paragraph {
  nr: string;
  titel: string;
  absaetze: (string | { text: string; liste: string[] })[];
}

export const SATZUNG: Paragraph[] = [
  {
    nr: "§ 1",
    titel: "Name, Rechtsstand und Sitz",
    absaetze: [
      "Die Stiftung führt den Namen „Bernhard Riepl Stiftung“. Sie ist eine rechtsfähige öffentliche Stiftung des bürgerlichen Rechts mit dem Sitz in 83714 Miesbach, Stadlbergstraße 54.",
    ],
  },
  {
    nr: "§ 2",
    titel: "Stiftungszweck",
    absaetze: [
      "(1) Zweck der Stiftung ist die Förderung kirchlicher, kultureller – insbesondere künstlerischer – Zwecke, der Bildung und Hilfe für notleidende Menschen. Sie verfolgt damit ausschließlich und unmittelbar gemeinnützige und mildtätige Zwecke im Sinne des Abschnitts „Steuerbegünstigte Zwecke“ der Abgabenordnung.",
      {
        text: "(2) Der Stiftungszweck wird insbesondere durch folgende Maßnahmen verwirklicht:",
        liste: [
          "Förderung kultureller Einrichtungen und Sammlungen",
          "Förderung künstlerischer Veranstaltungen, wie Konzerte und Ausstellungen",
          "Förderung künstlerischer Nachwuchstalente",
          "Stipendien für die Aus- und Fortbildung bedürftiger Personen",
          "Förderung notleidender Menschen und kirchlicher Hilfsprojekte",
        ],
      },
      "(3) Die Stiftung kann auch anderen, ebenfalls steuerbegünstigten Körperschaften, Vereinen, Anstalten und Stiftungen oder einer geeigneten öffentlichen Behörde finanzielle oder sachliche Mittel zur Verfügung stellen, wenn diese Stellen mit den Mitteln Maßnahmen nach Abs. 2 fördern.",
    ],
  },
  {
    nr: "§ 3",
    titel: "Einschränkungen",
    absaetze: [
      "(1) Die Stiftung ist selbstlos tätig. Sie verfolgt nicht in erster Linie eigenwirtschaftliche Zwecke. Sie darf keine juristische oder natürliche Person durch Ausgaben, die dem Zweck der Stiftung fremd sind, oder durch unverhältnismäßig hohe Unterstützungen, Zuwendungen oder Vergütungen begünstigen.",
      "(2) Ein Rechtsanspruch auf Gewährung des jederzeit widerruflichen Stiftungsgenusses besteht nicht.",
    ],
  },
];

/** Förderbereiche für die Sektion „Stiftungszweck“ (aus § 2 Abs. 1 und 2). */
export const FOERDERBEREICHE = [
  {
    titel: "Kirche",
    text: "Kirchliche Hilfsprojekte und Vorhaben, die das kirchliche Leben in der Region stärken.",
    bild: "/bilder/zweck-kirche.jpg",
    alt: "Weiß verputzte Dorfkirche mit rotem Ziegeldach und hohem Turm vor blauem Himmel, davor der Friedhof",
  },
  {
    titel: "Kunst und Kultur",
    text: "Kulturelle Einrichtungen und Sammlungen, Konzerte, Ausstellungen und künstlerische Nachwuchstalente.",
    bild: "/bilder/zweck-kunst-kultur.jpg",
    alt: "Collage: junge Geigerin im Konzertsaal, Bildhauer an einer Steinfigur, Theaterszene in historischen Kostümen und Trachtentanz am Maibaum",
  },
  {
    titel: "Bildung",
    text: "Stipendien für die Aus- und Fortbildung bedürftiger Personen.",
    bild: "/bilder/zweck-bildung.jpg",
    alt: "Studentin lernt in einer Bibliothek, eine Mentorin erklärt ihr etwas in einem Buch",
  },
  {
    titel: "Hilfe für Menschen in Not",
    text: "Unterstützung notleidender Menschen – unmittelbar oder über gemeinnützige Träger.",
    bild: "/bilder/zweck-hilfe.jpg",
    alt: "Junge Helferin reicht einem älteren Mann in einem Wohnzimmer eine Tasse Tee",
  },
];

export const COOKIE_HINWEIS =
  "Unsere Website verwendet Cookies. Dabei handelt es sich um kleine Textdateien, die auf Ihrem Endgerät gespeichert werden und die Ihr Browser speichert. Cookies richten auf Ihrem Endgerät keinen Schaden an. Sie dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen.";
