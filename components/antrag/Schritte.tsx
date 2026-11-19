"use client";

import { berechneSummen, deckungspruefung, formatBetrag, formatIban } from "@/lib/betrag";
import { Checkbox, JaNeinGruppe, Textbereich, Textfeld } from "../ui/Feld";
import { useAntrag, useFeld } from "./AntragKontext";
import { BetragZeile, Gruppe, SummenZeile } from "./BetragFeld";
import { DokumenteUpload } from "./DokumenteUpload";
import Link from "next/link";
import { AntragAnsicht } from "./AntragAnsicht";

function Untertitel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-2xl leading-snug mt-14 mb-6 pt-8 border-t border-neutral-400 first:mt-0 first:pt-0 first:border-0">{children}</h3>;
}

function T(props: { pfad: string; label: string; hinweis?: string; className?: string; type?: string; autoComplete?: string; placeholder?: string; inputMode?: "text" | "url" | "email" | "tel"; onBlur?: () => void }) {
  const f = useFeld(props.pfad);
  const { pfad, ...rest } = props;
  void pfad;
  return <Textfeld {...f} {...rest} />;
}

function TA(props: { pfad: string; label: string; hinweis?: string; rows?: number; className?: string }) {
  const f = useFeld(props.pfad);
  const { pfad, ...rest } = props;
  void pfad;
  return <Textbereich {...f} {...rest} />;
}

export function Schritt1() {
  const { daten, setze } = useAntrag();
  return (
    <>
      <div className="border-l-4 border-herbstgold bg-[#e0a21a1f] px-5 py-4 text-neutral-800 mb-10 max-w-[80ch]">
        <strong className="font-medium">Wichtiger Hinweis:</strong> Die Bernhard Riepl Stiftung fördert regulär keine
        Privatpersonen, sondern gemeinnützige Institutionen und öffentliche Einrichtungen. Ohne Nachweis über die
        Steuerbegünstigung (Freistellungsbescheinigung des Finanzamtes) wird der Antrag nicht bearbeitet. Zu möglichen
        Ausnahmen und den dann geforderten Nachweisen siehe{" "}
        <a href="/#faq" target="_blank" rel="noopener" className="underline underline-offset-4">
          „Wer kann einen Förderantrag stellen?“ in den Fragen und Antworten
          <span className="sr-only"> (öffnet in neuem Tab)</span>
        </a>
        .
      </div>
      <Untertitel>1.1 Bezeichnung der Institution</Untertitel>
      <div className="grid gap-6 md:grid-cols-2">
        <T pfad="antragsteller.name" label="Name des Antragstellers" autoComplete="organization" />
        <T pfad="antragsteller.rechtsform" label="Rechtsform" placeholder="z. B. e. V., gGmbH, Stiftung" />
        <T pfad="antragsteller.register" label="Nummer Handelsregister bzw. Vereinsregister" />
        <T pfad="antragsteller.steuernummer" label="Steuernummer bzw. Freistellungsbescheinigung" />
        <T pfad="antragsteller.strasse" label="Straße, Hausnummer" autoComplete="street-address" />
        <T pfad="antragsteller.plzOrt" label="PLZ / Ort" autoComplete="address-level2" />
        <T pfad="antragsteller.telefon" label="Telefon / Telefax" type="tel" autoComplete="tel" />
        <T pfad="antragsteller.email" label="E-Mail" type="email" autoComplete="email" />
        <T pfad="antragsteller.web" label="Internet-Adresse" inputMode="url" placeholder="www.beispiel.de" />
        <T pfad="antragsteller.vorsitz" label="Geschäftsführer(in) / Vorsitzende(r)" />
        <T pfad="antragsteller.projektverantwortlich" label="Verantwortlich für die Projektbearbeitung" hinweis="Name, Telefon / Telefax, E-Mail" className="md:col-span-2" />
      </div>
      <Untertitel>Institution</Untertitel>
      <div className="grid gap-6">
        <TA pfad="antragsteller.ziele" label="Ziele und Tätigkeit der Institution" rows={4} />
        <TA pfad="antragsteller.grundfinanzierung" label="Grundfinanzierung der Institution" rows={3} />
        <div className="grid gap-6 md:grid-cols-2 mt-2">
          <JaNeinGruppe
            name="vsa_inst"
            legende="Besteht eine Vorsteuerabzugsberechtigung für die Institution?"
            wert={daten.antragsteller.vorsteuerInstitution}
            onChange={(v) => setze("antragsteller.vorsteuerInstitution", v)}
          />
          {daten.antragsteller.vorsteuerInstitution === "Ja" && (
            <JaNeinGruppe
              name="vsa_proj"
              legende="Gilt sie auch für das Projekt?"
              wert={daten.antragsteller.vorsteuerProjekt}
              onChange={(v) => setze("antragsteller.vorsteuerProjekt", v)}
            />
          )}
        </div>
      </div>
    </>
  );
}

export function Schritt2() {
  return (
    <>
      <Untertitel>2.1 Kurzbeschreibung</Untertitel>
      <div className="grid gap-6 md:grid-cols-2">
        <T pfad="projekt.titel" label="Projekttitel" className="md:col-span-2" />
        <T pfad="projekt.zeitraum" label="Zeitraum" placeholder="z. B. 03/2027 bis 09/2027" />
        <T pfad="projekt.ort" label="Förderort" />
        <T pfad="projekt.partner" label="Projektpartner" className="md:col-span-2" />
        <TA pfad="projekt.kurzbeschreibung" label="Kurzbeschreibung des Projektes" rows={5} className="md:col-span-2" />
      </div>
      <Untertitel>2.2 Ausführliche Beschreibung des Projekts</Untertitel>
      <div className="grid gap-6">
        <TA pfad="projekt.ziel" label="Ziel" rows={4} />
        <TA pfad="projekt.gegenstand" label="Gegenstand" rows={4} />
        <TA pfad="projekt.vorarbeiten" label="Eigene Vorarbeiten, Erfahrungsstand, Referenzprojekte" rows={4} />
        <TA pfad="projekt.zielgruppe" label="Teilnehmer / Zielgruppe" hinweis="Anzahl, Alter, Herkunft, Auswahlkriterien" rows={4} />
        <TA pfad="projekt.ablauf" label="Projektaufbau und -ablauf, Zeitplan" hinweis="Skizzieren Sie die wichtigsten Arbeitsschritte und Methoden." rows={6} />
      </div>
    </>
  );
}

export function Schritt3() {
  const { daten, setze } = useAntrag();
  return (
    <div className="grid gap-8 max-w-[80ch]">
      <JaNeinGruppe
        name="fortsetzung"
        legende="Soll das Projekt fortgesetzt werden?"
        wert={daten.anschluss.fortsetzung}
        onChange={(v) => setze("anschluss.fortsetzung", v)}
      />
      <TA
        pfad="anschluss.sicherung"
        label="Wenn ja, wie planen Sie die finanzielle, organisatorische und institutionelle Sicherung?"
        rows={5}
      />
    </div>
  );
}

export function Schritt4() {
  const { daten, setze } = useAntrag();
  const s = berechneSummen(daten.kosten, daten.finanzierung);
  const d = deckungspruefung(s);
  const iban = useFeld("konto.iban");
  const bic = useFeld("konto.bic");
  const stil = { leer: "bg-neutral-300/60 text-neutral-800", ok: "bg-[#3f6b231a] text-wiese", warn: "bg-[#e0a21a29] text-neutral-800" }[d.art];
  return (
    <>
      <Untertitel>4.1 Kosten</Untertitel>
      <div className="max-w-[760px]">
        <BetragZeile pfad="kosten.sach" label="Sachkosten" hinweis="z. B. Transportkosten, Versicherung, Mieten, Material usw." />
        <Gruppe>Personalkosten</Gruppe>
        <BetragZeile pfad="kosten.honorare" label="Honorare" eingerueckt />
        <BetragZeile pfad="kosten.extern" label="Externe Projektleiter" eingerueckt />
        <BetragZeile pfad="kosten.eigen" label="Eigene Personalkosten" eingerueckt />
        <SummenZeile label="Gesamtkosten" wert={formatBetrag(s.kosten)} gesamt />
      </div>

      <Untertitel>4.2 Finanzierung</Untertitel>
      <div className="max-w-[760px]">
        <Gruppe>Eigene Mittel</Gruppe>
        <BetragZeile pfad="finanzierung.eigenkapital" label="Eigenkapital" eingerueckt />
        <BetragZeile pfad="finanzierung.eigenleistung" label="Eigenleistung" eingerueckt />
        <BetragZeile pfad="finanzierung.einnahmen" label="Zu erwartende Einnahmen" />
        <SummenZeile label="Öffentliche Mittel" hinweis="durch Anträge belegen" wert={formatBetrag(s.oeffentlich)} />
        <BetragZeile pfad="finanzierung.gemeinde" label="Gemeinde / Stadt" eingerueckt namePfad="finanzierung.gemeindeName" nameLabel="Name der Gemeinde / Stadt" namePlatzhalter="z. B. Stadt Miesbach" />
        <BetragZeile pfad="finanzierung.landkreis" label="Landkreis" eingerueckt namePfad="finanzierung.landkreisName" nameLabel="Name des Landkreises" namePlatzhalter="z. B. Landkreis Miesbach" />
        <BetragZeile pfad="finanzierung.land" label="Land / Bund" eingerueckt namePfad="finanzierung.landName" nameLabel="Fördernde Stelle bei Land / Bund" namePlatzhalter="z. B. Bayerischer Kulturfonds" />
        <BetragZeile pfad="finanzierung.sonstige" label="Sonstige" eingerueckt namePfad="finanzierung.sonstigeName" nameLabel="Name der Stelle" namePlatzhalter="z. B. Bezirk Oberbayern" />
        <BetragZeile pfad="finanzierung.weitere" label="Weitere Mittel" hinweis="z. B. durch Firmen o. ä." />
        <BetragZeile pfad="finanzierung.stiftung" label="Bernhard Riepl Stiftung – beantragte Förderung" hinweis="Der Betrag, den Sie bei der Stiftung beantragen." hervorgehoben />
        <SummenZeile label="Summe Finanzierung" wert={formatBetrag(s.finanzierung)} gesamt />
        <p role="status" className={`mt-5 px-5 py-3 font-medium ${stil}`}>
          {d.text}
        </p>
        <p className="mt-3 text-sm text-neutral-700">Die Spalte „bewilligt“ füllt die Stiftung aus.</p>
      </div>

      <Untertitel>4.3 Kontoverbindung</Untertitel>
      <div className="grid gap-6 md:grid-cols-2 max-w-[760px]">
        <T pfad="konto.institut" label="Kreditinstitut" className="md:col-span-2" />
        <Textfeld {...iban} label="IBAN" autoComplete="off" spellCheck={false} autoCapitalize="characters" onBlur={() => setze("konto.iban", formatIban(iban.value))} />
        <Textfeld {...bic} label="BIC" autoComplete="off" spellCheck={false} autoCapitalize="characters" onBlur={() => setze("konto.bic", bic.value.replace(/\s/g, "").toUpperCase())} />
      </div>
      <p className="mt-3 text-sm text-neutral-700">IBAN und BIC werden nicht als Entwurf im Browser zwischengespeichert.</p>

      <Untertitel>Ort</Untertitel>
      <div className="max-w-sm">
        <T pfad="ortDatum" label="Ort" placeholder="z. B. Miesbach" hinweis="Das Datum wird beim Absenden automatisch ergänzt." />
      </div>
    </>
  );
}

export function Schritt5() {
  return <DokumenteUpload />;
}

export function Schritt6() {
  const { daten, setze, fehler, dateien, geheZu } = useAntrag();
  const dokumente = Object.entries(dateien).flatMap(([kategorie, fs]) =>
    fs.map((f) => ({ kategorie, dateiname: f.name, groesse: f.size })),
  );
  return (
    <>
      <p className="text-lg max-w-[70ch]">
        Bitte prüfen Sie Ihre Angaben. Über „Bearbeiten“ gelangen Sie zum jeweiligen Schritt zurück.
      </p>
      <div className="mt-10">
        <AntragAnsicht daten={daten} dokumente={dokumente} onBearbeiten={geheZu} />
      </div>

      <section aria-labelledby="bestaetigen-titel" className="mt-16 border-t border-neutral-800 pt-10 max-w-[80ch]">
        <h3 id="bestaetigen-titel" className="text-2xl leading-snug mb-4">Datenschutz und Bestätigung</h3>
        <p className="text-sm leading-relaxed text-neutral-700 mb-8">
          Ihre Daten im Antrag auf Förderung (Förderantrag) werden ausschließlich zur Bearbeitung Ihrer Anfrage elektronisch
          gespeichert. Alle mit der Verarbeitung der Daten betrauten Firmen und deren Mitarbeiter haben die Verpflichtung auf
          das Datengeheimnis gemäß den Regelungen des Art. 5 DS-GVO unterzeichnet. Die Informationspflichten gemäß Art. 13
          DS-GVO finden Sie in der{" "}
          <Link href="/datenschutz" target="_blank" className="underline underline-offset-4 text-neutral-800">
            Datenschutzerklärung<span className="sr-only"> (öffnet in neuem Tab)</span>
          </Link>
          .
        </p>
        <div className="grid gap-5">
          <Checkbox id="f-bestaetigung" checked={daten.bestaetigung} onChange={(v) => setze("bestaetigung", v)} fehler={fehler["bestaetigung"]} pflicht>
            Ich bestätige die Richtigkeit der Angaben.
          </Checkbox>
          <Checkbox id="f-datenschutz" checked={daten.datenschutz} onChange={(v) => setze("datenschutz", v)} fehler={fehler["datenschutz"]} pflicht>
            Ich habe den Datenschutzhinweis zur Kenntnis genommen und bin mit der Verarbeitung meiner Daten zur Bearbeitung des
            Antrags einverstanden.
          </Checkbox>
        </div>
      </section>
    </>
  );
}
