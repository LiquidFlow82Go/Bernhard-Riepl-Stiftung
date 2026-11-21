"use client";

import { useState, type ReactNode } from "react";
import { formatBetrag, parseBetrag } from "@/lib/betrag";
import { formatGroesse } from "@/lib/dokumente";
import { zeigeDatei } from "@/lib/dokumente";
import { ladeInitiativDatei } from "@/lib/initiativen";
import {
  BELEG_ANGEBOT_TEXT,
  BELEG_RECHNUNG_TEXT,
  BEDUERFTIGKEIT,
  brauchtBescheid,
  EINZELFALL_VERMERK,
  EMPFAENGER_LABEL,
  NICHT_VERWANDT_TEXT,
  STEUER_NACHWEISE,
  INITIATIV_DOK_LABEL,
  SATZUNGSZWECKE,
  VERFLECHTUNG_TEXT,
  nachweisArtLabel,
  type InitiativDaten,
  type InitiativDokKategorie,
  type InitiativDokument,
} from "@/lib/initiativeTypen";
import { tag } from "./Gemeinsam";

function Zeile({ label, wert, children }: { label: string; wert?: string; children?: ReactNode }) {
  const leer = !children && (!wert || !wert.trim());
  return (
    <div className="grid gap-1 py-3 border-b border-[#e4c9a5] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
      <dt className="text-sm text-neutral-700">{label}</dt>
      <dd className={`whitespace-pre-line break-words ${leer ? "text-neutral-700 italic" : "text-neutral-800"}`}>
        {children ?? (leer ? "keine Angabe" : wert)}
      </dd>
    </div>
  );
}

function Abschnitt({ nr, titel, schritt, onBearbeiten, children }: { nr: string; titel: string; schritt: number; onBearbeiten?: (s: number) => void; children: ReactNode }) {
  return (
    <section className="mb-12">
      <div className="flex items-end justify-between gap-4 border-b border-neutral-800 pb-3">
        <h3 className="text-2xl leading-snug">
          <span className="text-neutral-700 mr-3">{nr}</span>
          {titel}
        </h3>
        {onBearbeiten && (
          <button type="button" onClick={() => onBearbeiten(schritt)} className="shrink-0 text-sm underline underline-offset-4 text-neutral-800 cursor-pointer min-h-11 px-1">
            Bearbeiten<span className="sr-only">: {titel}</span>
          </button>
        )}
      </div>
      <dl>{children}</dl>
    </section>
  );
}

export function DokumentAktion({ d }: { d: InitiativDokument }) {
  const [fehler, setFehler] = useState("");
  async function oeffnen(herunterladen: boolean) {
    setFehler("");
    try {
      await zeigeDatei(() => ladeInitiativDatei(d), d.dateiname, d.mimeType, herunterladen);
    } catch (e) {
      setFehler((e as Error).message);
    }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-4">
      <button type="button" onClick={() => oeffnen(false)} className="text-sm underline underline-offset-4 text-neutral-800 cursor-pointer min-h-11 px-1">
        Ansehen<span className="sr-only">: {d.dateiname} (öffnet in neuem Tab)</span>
      </button>
      <button type="button" onClick={() => oeffnen(true)} className="text-sm underline underline-offset-4 text-neutral-800 cursor-pointer min-h-11 px-1">
        Herunterladen<span className="sr-only">: {d.dateiname}</span>
      </button>
      {fehler && <span role="alert" className="text-sm text-fehler">{fehler}</span>}
    </span>
  );
}

function Dokumente({ liste, kategorien }: { liste: InitiativDokument[]; kategorien: InitiativDokKategorie[] }) {
  const passend = liste.filter((d) => kategorien.includes(d.kategorie));
  if (!passend.length) return <span className="text-neutral-700 italic">keine Datei</span>;
  return (
    <ul className="grid gap-1">
      {passend.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-x-4">
          <span className="min-w-0 break-all">
            {d.dateiname}{" "}
            <span className="text-sm text-neutral-700">
              · {formatGroesse(d.groesse)} · {d.nachweisArt ? nachweisArtLabel(d.nachweisArt) : INITIATIV_DOK_LABEL[d.kategorie]}
            </span>
          </span>
          <DokumentAktion d={d} />
        </li>
      ))}
    </ul>
  );
}

function Haken({ an, children }: { an: boolean; children: ReactNode }) {
  return (
    <span className="flex items-start gap-2">
      <span aria-hidden="true" className={`mt-0.5 grid place-items-center size-5 shrink-0 border ${an ? "bg-neutral-800 border-neutral-800 text-neutral-100" : "border-neutral-700"}`}>
        {an ? "✓" : ""}
      </span>
      <span>
        <span className="sr-only">{an ? "Erledigt: " : "Offen: "}</span>
        {children}
      </span>
    </span>
  );
}

/** Schreibgeschützte Darstellung (Zusammenfassung im Formular und Detailansicht). */
export function InitiativAnsicht({
  daten, aktenzeichen, dokumente, onBearbeiten,
}: {
  daten: InitiativDaten;
  aktenzeichen?: string;
  dokumente: InitiativDokument[];
  onBearbeiten?: (s: number) => void;
}) {
  const S = daten.stammdaten, Z = daten.zweck, F = daten.finanzen, B = daten.beschluss, A = daten.abschluss, E = daten.einzelfall;
  const p = parseBetrag(F.betrag);
  const betrag = p.ok && !p.leer ? `${formatBetrag(p.n)} €` : "";
  return (
    <div>
      <Abschnitt nr="1" titel="Projekt-Stammdaten" schritt={1} onBearbeiten={onBearbeiten}>
        <Zeile label="Aktenzeichen" wert={aktenzeichen ?? "wird beim ersten Speichern vergeben"} />
        <Zeile label="Datum" wert={tag(S.datum)} />
        <Zeile label="Projekttitel" wert={S.titel} />
        <Zeile label="Empfänger der Förderung" wert={S.empfaengerArt ? EMPFAENGER_LABEL[S.empfaengerArt] : ""} />
        {S.empfaengerArt === "privat" ? (
          <Zeile label="Geförderte Person" wert={`${S.vorname} ${S.nachname}`.trim()} />
        ) : (
          <>
            <Zeile label="Durchführungspartner" wert={S.partnerName} />
            <Zeile label="Träger bzw. Rechtsform" wert={S.partnerTraeger} />
            <Zeile label="Ansprechperson" wert={S.ansprechperson} />
          </>
        )}
        <Zeile label="E-Mail" wert={S.email} />
        <Zeile label="Telefon" wert={S.telefon} />
        <Zeile label="Anschrift" wert={S.anschrift} />
        <Zeile label="Art der Initiative" wert={S.art} />
      </Abschnitt>

      <Abschnitt nr="2" titel="Zweckbindung & Bedarfsbegründung" schritt={2} onBearbeiten={onBearbeiten}>
        <Zeile label="Bezug zum Stiftungszweck (§ 2 der Satzung)">
          {Z.bereiche.length ? (
            <ul className="list-disc pl-5">
              {SATZUNGSZWECKE.filter((s) => Z.bereiche.includes(s.id)).map((s) => (
                <li key={s.id}>{s.label}</li>
              ))}
            </ul>
          ) : (
            <span className="text-neutral-700 italic">keine Angabe</span>
          )}
        </Zeile>
        <Zeile label="Begründung" wert={Z.begruendung} />
        <Zeile label="Ausgangslage & Zielsetzung" wert={Z.ausgangslage} />
      </Abschnitt>

      <Abschnitt nr="3" titel="Finanzen & Mittelverwendung" schritt={3} onBearbeiten={onBearbeiten}>
        <Zeile label="Fördergegenstand" wert={F.gegenstand} />
        <Zeile label="Förderbetrag">
          {betrag ? <strong className="font-medium text-lg tabular-nums text-[#8a3f0c]">{betrag}</strong> : <span className="text-neutral-700 italic">keine Angabe</span>}
        </Zeile>
        <Zeile label="Kostenvoranschlag / Angebot vom" wert={tag(F.angebotVom)} />
        <Zeile label="Angebot (Datei)">
          <Dokumente liste={dokumente} kategorien={["angebot"]} />
        </Zeile>
        <Zeile label="Auszahlungsmodalität" wert={F.auszahlung} />
      </Abschnitt>

      <Abschnitt nr="4" titel="Gremienbeschluss & Compliance" schritt={4} onBearbeiten={onBearbeiten}>
        <Zeile label="Beschluss vom" wert={tag(B.datum)} />
        <Zeile label="Protokoll / TOP" wert={B.protokoll} />
        {S.empfaengerArt === "privat" ? (
          <>
            <Zeile label="Gemeinnützigkeit" wert={EINZELFALL_VERMERK} />
            <Zeile label="Art der Bedürftigkeit">
              {E.beduerftigkeit.length ? (
                <ul className="list-disc pl-5">
                  {BEDUERFTIGKEIT.filter((b) => E.beduerftigkeit.includes(b.id)).map((b) => <li key={b.id}>{b.label}</li>)}
                </ul>
              ) : (
                <span className="text-neutral-700 italic">keine Angabe</span>
              )}
            </Zeile>
            <Zeile label="Nachweise der Bedürftigkeit">
              <Dokumente liste={dokumente} kategorien={["beduerftigkeit"]} />
            </Zeile>
            <Zeile label="Bedürftigkeit geprüft" wert={[tag(E.geprueftAm), E.geprueftVon.trim()].filter(Boolean).join(" · von ")} />
            <Zeile label="Verwandtschaft">
              <Haken an={E.nichtVerwandt}>{NICHT_VERWANDT_TEXT}</Haken>
            </Zeile>
          </>
        ) : (
          <>
            <Zeile label="Nachweis der Steuerbegünstigung" wert={STEUER_NACHWEISE.find((s) => s.id === B.steuerNachweis)?.label ?? ""} />
            {brauchtBescheid(B.steuerNachweis) && <Zeile label="Datum des Bescheids" wert={tag(B.bescheidDatum)} />}
            {brauchtBescheid(B.steuerNachweis) && (
              <Zeile label="Bescheid (Datei)">
                <Dokumente liste={dokumente} kategorien={["gemeinnuetzigkeit"]} />
              </Zeile>
            )}
            <Zeile label="Ergänzende Hinweise" wert={B.ergaenzendeHinweise} />
          </>
        )}
        <Zeile label="Interessenkonflikte">
          <Haken an={B.keineVerflechtung}>{VERFLECHTUNG_TEXT}</Haken>
          {!B.keineVerflechtung && B.verflechtungText.trim() && <p className="mt-2">Erläuterung: {B.verflechtungText}</p>}
        </Zeile>
      </Abschnitt>

      <Abschnitt nr="5" titel="Abschluss & Verwendungsnachweis" schritt={5} onBearbeiten={onBearbeiten}>
        <Zeile label="Belegprüfung">
          <div className="grid gap-2">
            <Haken an={A.belegAngebot}>{BELEG_ANGEBOT_TEXT}</Haken>
            <Haken an={A.belegRechnung}>{BELEG_RECHNUNG_TEXT}</Haken>
          </div>
        </Zeile>
        <Zeile label="Belege (Dateien)">
          <Dokumente liste={dokumente} kategorien={["beleg_angebot", "beleg_rechnung", "sonstige"]} />
        </Zeile>
        <Zeile label="Mittelverwendung geprüft am" wert={tag(A.geprueftAm)} />
        <Zeile label="Kürzel" wert={A.kuerzel} />
      </Abschnitt>
    </div>
  );
}
