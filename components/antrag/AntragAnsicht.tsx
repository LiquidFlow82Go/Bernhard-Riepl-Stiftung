"use client";

import type { ReactNode } from "react";
import { berechneSummen, deckungspruefung, formatBetrag, parseBetrag } from "@/lib/betrag";
import { formatGroesse } from "@/lib/dokumente";
import { DOKUMENT_LABEL, type AntragDaten, type DokumentKategorie } from "@/lib/types";

/** Schreibgeschützte Darstellung aller Antragsdaten (Zusammenfassung, Konto, Stiftungsrat). */

function Zeile({ label, wert, lang }: { label: string; wert?: string; lang?: boolean }) {
  const leer = !wert || !wert.trim();
  return (
    <div className={`grid gap-1 py-3 border-b border-neutral-400 ${lang ? "" : "sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6"}`}>
      <dt className="text-sm text-neutral-700">{label}</dt>
      <dd className={`whitespace-pre-line break-words ${leer ? "text-neutral-700 italic" : "text-neutral-800"}`}>{leer ? "keine Angabe" : wert}</dd>
    </div>
  );
}

function Abschnitt({
  nr, titel, schritt, onBearbeiten, children,
}: {
  nr: string;
  titel: string;
  schritt: number;
  onBearbeiten?: (s: number) => void;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-end justify-between gap-4 border-b border-neutral-800 pb-3">
        <h3 className="text-2xl leading-snug">
          <span className="text-neutral-700 mr-3">{nr}</span>
          {titel}
        </h3>
        {onBearbeiten && (
          <button type="button" onClick={() => onBearbeiten(schritt)} className="shrink-0 text-sm underline underline-offset-4 text-neutral-800 cursor-pointer py-1">
            Bearbeiten<span className="sr-only">: {titel}</span>
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function euro(v: string) {
  const p = parseBetrag(v);
  return p.leer || !p.ok ? "" : `${formatBetrag(p.n)} €`;
}

export interface AnsichtDokument {
  kategorie: string;
  dateiname: string;
  groesse: number;
  aktionen?: ReactNode;
}

export function AntragAnsicht({
  daten, dokumente, onBearbeiten, bewilligt,
}: {
  daten: AntragDaten;
  dokumente: AnsichtDokument[];
  onBearbeiten?: (s: number) => void;
  bewilligt?: number | null;
}) {
  const A = daten.antragsteller, P = daten.projekt, K = daten.kosten, F = daten.finanzierung;
  const s = berechneSummen(K, F);
  const deck = deckungspruefung(s);
  return (
    <div>
      <Abschnitt nr="1" titel="Antragsteller" schritt={1} onBearbeiten={onBearbeiten}>
        <dl>
          <Zeile label="Name des Antragstellers" wert={A.name} />
          <Zeile label="Rechtsform" wert={A.rechtsform} />
          <Zeile label="Handels- bzw. Vereinsregister" wert={A.register} />
          <Zeile label="Steuernummer bzw. Freistellungsbescheinigung" wert={A.steuernummer} />
          <Zeile label="Anschrift" wert={[A.strasse, A.plzOrt].filter(Boolean).join("\n")} />
          <Zeile label="Telefon / Telefax" wert={A.telefon} />
          <Zeile label="E-Mail" wert={A.email} />
          <Zeile label="Internet-Adresse" wert={A.web} />
          <Zeile label="Geschäftsführer(in) / Vorsitzende(r)" wert={A.vorsitz} />
          <Zeile label="Verantwortlich für die Projektbearbeitung" wert={A.projektverantwortlich} />
          <Zeile label="Ziele und Tätigkeit der Institution" wert={A.ziele} />
          <Zeile label="Grundfinanzierung der Institution" wert={A.grundfinanzierung} />
          <Zeile label="Vorsteuerabzugsberechtigung Institution" wert={A.vorsteuerInstitution} />
          {A.vorsteuerInstitution === "Ja" && <Zeile label="Vorsteuerabzug gilt auch für das Projekt" wert={A.vorsteuerProjekt} />}
        </dl>
      </Abschnitt>

      <Abschnitt nr="2" titel="Projekt" schritt={2} onBearbeiten={onBearbeiten}>
        <dl>
          <Zeile label="Projekttitel" wert={P.titel} />
          <Zeile label="Zeitraum" wert={P.zeitraum} />
          <Zeile label="Förderort" wert={P.ort} />
          <Zeile label="Projektpartner" wert={P.partner} />
          <Zeile label="Kurzbeschreibung" wert={P.kurzbeschreibung} />
          <Zeile label="Ziel" wert={P.ziel} />
          <Zeile label="Gegenstand" wert={P.gegenstand} />
          <Zeile label="Vorarbeiten, Erfahrungsstand, Referenzprojekte" wert={P.vorarbeiten} />
          <Zeile label="Teilnehmer / Zielgruppe" wert={P.zielgruppe} />
          <Zeile label="Projektaufbau und -ablauf, Zeitplan" wert={P.ablauf} />
        </dl>
      </Abschnitt>

      <Abschnitt nr="3" titel="Anschlussperspektive" schritt={3} onBearbeiten={onBearbeiten}>
        <dl>
          <Zeile label="Fortsetzung geplant" wert={daten.anschluss.fortsetzung} />
          <Zeile label="Finanzielle, organisatorische und institutionelle Sicherung" wert={daten.anschluss.sicherung} />
        </dl>
      </Abschnitt>

      <Abschnitt nr="4" titel="Finanzen" schritt={4} onBearbeiten={onBearbeiten}>
        <div className="grid gap-10 lg:grid-cols-2 mt-2">
          <dl>
            <Zeile label="Sachkosten" wert={euro(K.sach)} />
            <Zeile label="Honorare" wert={euro(K.honorare)} />
            <Zeile label="Externe Projektleiter" wert={euro(K.extern)} />
            <Zeile label="Eigene Personalkosten" wert={euro(K.eigen)} />
            <div className="grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-1 sm:gap-6 py-3 border-t-2 border-neutral-800">
              <dt className="font-medium text-neutral-800">Gesamtkosten</dt>
              <dd className="font-medium text-neutral-800 tabular-nums">{formatBetrag(s.kosten)} €</dd>
            </div>
          </dl>
          <dl>
            <Zeile label="Eigenkapital" wert={euro(F.eigenkapital)} />
            <Zeile label="Eigenleistung" wert={euro(F.eigenleistung)} />
            <Zeile label="Zu erwartende Einnahmen" wert={euro(F.einnahmen)} />
            <Zeile label="Öffentliche Mittel (Summe)" wert={`${formatBetrag(s.oeffentlich)} €`} />
            <Zeile label="Weitere Mittel" wert={euro(F.weitere)} />
            <Zeile label="Bernhard Riepl Stiftung (beantragt)" wert={euro(F.stiftung)} />
            {bewilligt != null && <Zeile label="Bernhard Riepl Stiftung (bewilligt)" wert={`${formatBetrag(bewilligt)} €`} />}
            <div className="grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-1 sm:gap-6 py-3 border-t-2 border-neutral-800">
              <dt className="font-medium text-neutral-800">Summe Finanzierung</dt>
              <dd className="font-medium text-neutral-800 tabular-nums">{formatBetrag(s.finanzierung)} €</dd>
            </div>
          </dl>
        </div>
        <p className={`mt-4 px-5 py-3 ${deck.art === "ok" ? "bg-[#3f6b231a] text-wiese" : "bg-[#e0a21a29] text-neutral-800"}`}>{deck.text}</p>
        <dl className="mt-6">
          <Zeile label="Kreditinstitut" wert={daten.konto.institut} />
          <Zeile label="IBAN" wert={daten.konto.iban} />
          <Zeile label="BIC" wert={daten.konto.bic} />
          <Zeile label="Ort" wert={daten.ortDatum} />
        </dl>
      </Abschnitt>

      <Abschnitt nr="5" titel="Dokumente" schritt={5} onBearbeiten={onBearbeiten}>
        {dokumente.length === 0 ? (
          <p className="py-4 text-neutral-700 italic">Keine Dokumente hochgeladen.</p>
        ) : (
          <ul>
            {dokumente.map((d, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 border-b border-neutral-400">
                <span className="min-w-0">
                  <span className="block text-sm text-neutral-700">{DOKUMENT_LABEL[d.kategorie as DokumentKategorie] ?? d.kategorie}</span>
                  <span className="text-neutral-800 break-all">{d.dateiname}</span>
                  <span className="text-sm text-neutral-700"> · {formatGroesse(d.groesse)}</span>
                </span>
                {d.aktionen}
              </li>
            ))}
          </ul>
        )}
      </Abschnitt>
    </div>
  );
}
