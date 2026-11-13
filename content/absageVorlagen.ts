/**
 * Vorlagen für Absagen. Acht Ausschlussgründe – je ein Button im Stiftungsrat.
 *
 * Platzhalter, die beim Öffnen des Dialogs ersetzt werden:
 *   {anrede}          – „Sehr geehrte Damen und Herren“ bzw. Name der Ansprechperson
 *   {institution}     – Name des Antragstellers
 *   {projekttitel}    – Titel des Projekts
 *   {antragsnummer}   – z. B. 2026-004
 *   {eingangsdatum}   – Datum der Einreichung
 *   {betrag}          – beantragte Fördersumme
 *
 * Die Texte sind Entwürfe und vor dem Livegang von Stiftungsvorstand bzw. -rat freizugeben.
 */

export interface AbsageVorlage {
  id: string;
  titel: string;
  kurz: string;
  betreff: string;
  text: string;
}

const GRUSS = `Wir danken Ihnen für Ihr Engagement und wünschen Ihnen für Ihre weitere Arbeit alles Gute.

Mit freundlichen Grüßen

Der Stiftungsrat der Bernhard Riepl Stiftung
Stadlbergstraße 56 · 83714 Miesbach`;

const EINLEITUNG = `{anrede},

vielen Dank für Ihren Förderantrag {antragsnummer} „{projekttitel}“ vom {eingangsdatum} und das Interesse an der Bernhard Riepl Stiftung.`;

export const ABSAGE_VORLAGEN: AbsageVorlage[] = [
  {
    id: "privatperson",
    titel: "Antrag einer Privatperson",
    kurz: "Antragsteller ist keine gemeinnützige Institution",
    betreff: "Ihr Förderantrag {antragsnummer} – Bernhard Riepl Stiftung",
    text: `${EINLEITUNG}

Nach ihrer Satzung fördert die Bernhard Riepl Stiftung ausschließlich Institutionen, die ihrerseits gemeinnützig tätig sind. Anträge von Privatpersonen können wir leider nicht berücksichtigen. Wir müssen Ihren Antrag daher ablehnen.

Falls Ihr Vorhaben von einem gemeinnützigen Träger – etwa einem Verein oder einer Kirchengemeinde – durchgeführt wird, kann dieser gerne einen eigenen Antrag stellen.

${GRUSS}`,
  },
  {
    id: "gemeinnuetzigkeit",
    titel: "Gemeinnützigkeit nicht nachgewiesen",
    kurz: "Freistellungsbescheinigung fehlt oder ist abgelaufen",
    betreff: "Ihr Förderantrag {antragsnummer} – fehlender Nachweis der Gemeinnützigkeit",
    text: `${EINLEITUNG}

Voraussetzung für die Bearbeitung eines Antrags ist der Nachweis der Steuerbegünstigung durch eine gültige Freistellungsbescheinigung des Finanzamtes. Ein solcher Nachweis liegt uns für {institution} nicht vor. Wir können Ihren Antrag deshalb in der vorliegenden Form nicht bearbeiten und müssen ihn ablehnen.

Sobald Ihnen eine aktuelle Freistellungsbescheinigung vorliegt, können Sie gerne einen neuen Antrag stellen.

${GRUSS}`,
  },
  {
    id: "zweck",
    titel: "Außerhalb des Stiftungszwecks",
    kurz: "Vorhaben passt nicht zu § 2 der Satzung",
    betreff: "Ihr Förderantrag {antragsnummer} – Bernhard Riepl Stiftung",
    text: `${EINLEITUNG}

Der Stiftungsrat hat Ihren Antrag sorgfältig geprüft. Die Stiftung ist durch ihre Satzung an die Förderung kirchlicher, kultureller – insbesondere künstlerischer – Zwecke, der Bildung und der Hilfe für notleidende Menschen gebunden. Ihr Vorhaben lässt sich diesen Zwecken leider nicht ausreichend zuordnen, sodass wir es nicht fördern können.

${GRUSS}`,
  },
  {
    id: "unvollstaendig",
    titel: "Unterlagen unvollständig",
    kurz: "Pflichtunterlagen oder Angaben fehlen",
    betreff: "Ihr Förderantrag {antragsnummer} – unvollständige Unterlagen",
    text: `${EINLEITUNG}

Leider sind die Antragsunterlagen nicht vollständig. Bei Vereinen benötigen wir neben der Freistellungsbescheinigung des Finanzamtes auch die Satzung, einen aktuellen Vereinsregisterauszug und die Gemeinnützigkeitsbescheinigung. Darüber hinaus fehlen Angaben, die für eine Entscheidung notwendig sind. [Fehlende Unterlagen bzw. Angaben hier nennen.]

Wir müssen den Antrag daher in der vorliegenden Form ablehnen. Sie können gerne einen neuen, vollständigen Antrag einreichen.

${GRUSS}`,
  },
  {
    id: "finanzierung",
    titel: "Finanzierung nicht schlüssig",
    kurz: "Kosten- und Finanzierungsplan nicht gedeckt oder nachvollziehbar",
    betreff: "Ihr Förderantrag {antragsnummer} – Bernhard Riepl Stiftung",
    text: `${EINLEITUNG}

Der Stiftungsrat hat Ihren Antrag geprüft. Der vorgelegte Kosten- und Finanzierungsplan ist für uns nicht ausreichend nachvollziehbar bzw. die Gesamtfinanzierung des Vorhabens erscheint nicht gesichert. Da die Stiftung nur Vorhaben unterstützen kann, deren Durchführung insgesamt gewährleistet ist, müssen wir Ihren Antrag ablehnen.

Bei einer überarbeiteten Planung mit belegten Eigen- und Drittmitteln können Sie gerne einen neuen Antrag stellen.

${GRUSS}`,
  },
  {
    id: "begonnen",
    titel: "Vorhaben bereits begonnen",
    kurz: "Keine rückwirkende Förderung",
    betreff: "Ihr Förderantrag {antragsnummer} – Bernhard Riepl Stiftung",
    text: `${EINLEITUNG}

Ihr Vorhaben hat nach den Angaben im Antrag bereits begonnen bzw. ist bereits abgeschlossen. Eine nachträgliche Förderung bereits begonnener oder abgeschlossener Vorhaben ist leider nicht möglich. Wir müssen Ihren Antrag daher ablehnen.

${GRUSS}`,
  },
  {
    id: "grundfinanzierung",
    titel: "Laufende Kosten / Grundfinanzierung",
    kurz: "Keine institutionelle Förderung",
    betreff: "Ihr Förderantrag {antragsnummer} – Bernhard Riepl Stiftung",
    text: `${EINLEITUNG}

Die Bernhard Riepl Stiftung unterstützt einzelne, zeitlich abgegrenzte Vorhaben. Laufende Betriebs- und Personalkosten oder die Grundfinanzierung einer Institution kann sie nicht übernehmen. Da Ihr Antrag im Wesentlichen solche Kosten betrifft, müssen wir ihn leider ablehnen.

${GRUSS}`,
  },
  {
    id: "mittel",
    titel: "Fördermittel ausgeschöpft",
    kurz: "Kein Budget im laufenden Jahr",
    betreff: "Ihr Förderantrag {antragsnummer} – Bernhard Riepl Stiftung",
    text: `${EINLEITUNG}

Ihr Vorhaben hat uns angesprochen. Die Zahl der Anträge übersteigt jedoch die Mittel, die der Stiftung in diesem Jahr zur Verfügung stehen. Die verfügbaren Fördermittel sind für das laufende Jahr bereits vollständig vergeben, sodass wir Ihrem Antrag leider nicht entsprechen können.

Gerne können Sie im kommenden Jahr einen neuen Antrag stellen.

${GRUSS}`,
  },
];

export interface AbsageKontext {
  anrede?: string;
  institution: string;
  projekttitel: string;
  antragsnummer: string;
  eingangsdatum: string;
  betrag: string;
}

export function fuelleVorlage(text: string, k: AbsageKontext): string {
  const werte: Record<string, string> = {
    anrede: k.anrede || "Sehr geehrte Damen und Herren",
    institution: k.institution,
    projekttitel: k.projekttitel,
    antragsnummer: k.antragsnummer,
    eingangsdatum: k.eingangsdatum,
    betrag: k.betrag,
  };
  return text.replace(/\{(\w+)\}/g, (m, key: string) => werte[key] ?? m);
}
