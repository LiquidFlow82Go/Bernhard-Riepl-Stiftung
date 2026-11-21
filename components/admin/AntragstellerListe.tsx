"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ladeAntragstellerKonten, ladeAntragstellerKonto, type AntragstellerKonto } from "@/lib/antraege";
import { anzeigeName, datumDe } from "@/lib/format";
import { KontoDetail } from "../konto/KontoDetail";
import { KontoUebersicht } from "../konto/KontoUebersicht";
import { NurLesenHinweis, Zurueck } from "../konto/Gemeinsam";
import { Hinweisbox, Laden } from "../ui/Diverses";

/** Admin: Liste aller Antragsteller-Konten als Einstieg in die lesende Ansicht. */
export function AntragstellerListe() {
  const [liste, setListe] = useState<AntragstellerKonto[] | null>(null);
  const [fehler, setFehler] = useState(false);
  useEffect(() => {
    ladeAntragstellerKonten().then(setListe).catch(() => setFehler(true));
  }, []);

  return (
    <div className="container-site py-12 lg:py-20">
      <Zurueck href="/stiftungsvorstand/antraege">Alle Anträge</Zurueck>
      <p className="mt-8 caps text-sm text-neutral-700 mb-3">Admin</p>
      <h1 className="text-[44px] leading-[1.1] lg:text-[60px] lg:leading-none">Ansicht Antragsteller</h1>
      <div className="mt-8 mb-10 max-w-3xl"><NurLesenHinweis /></div>

      {fehler ? (
        <Hinweisbox art="fehler" rolle="alert">Die Konten konnten nicht geladen werden. Bitte laden Sie die Seite neu.</Hinweisbox>
      ) : !liste ? (
        <Laden />
      ) : liste.length === 0 ? (
        <p className="py-16 text-lg border-y border-neutral-400">Es gibt noch keine Antragsteller-Konten.</p>
      ) : (
        <ul className="border-t border-neutral-400">
          {liste.map((k) => (
            <li key={k.id} className="border-b border-neutral-400">
              <Link
                href={`/stiftungsvorstand/antragsteller/${k.id}`}
                className="grid gap-1 py-5 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto] md:items-center md:gap-6 hover:bg-neutral-100"
              >
                <span className="text-lg text-neutral-800 underline underline-offset-4 break-words">{anzeigeName(k)}</span>
                <span className="text-sm text-neutral-700 break-words">
                  {k.institution ? `${k.institution} · ` : ""}{k.email}
                </span>
                <span className="text-sm text-neutral-700 whitespace-nowrap">
                  {k.anzahlAntraege === 1 ? "1 Antrag" : `${k.anzahlAntraege} Anträge`} · seit {datumDe(k.erstelltAm)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Admin: „Meine Anträge“ eines Kontos, wie der Antragsteller sie sieht – nur lesend. */
export function AntragstellerKontoAnsicht() {
  const { benutzerId } = useParams<{ benutzerId: string }>();
  const [konto, setKonto] = useState<AntragstellerKonto | null | undefined>(undefined);
  useEffect(() => {
    ladeAntragstellerKonto(benutzerId).then(setKonto).catch(() => setKonto(null));
  }, [benutzerId]);

  if (konto === undefined) return <Laden />;
  if (konto === null)
    return (
      <div className="container-site py-20">
        <Zurueck href="/stiftungsvorstand/antragsteller">Alle Antragsteller</Zurueck>
        <h1 className="mt-6 text-4xl">Konto nicht gefunden</h1>
      </div>
    );
  return (
    <Suspense>
      <KontoUebersicht ansicht={{ konto, basis: `/stiftungsvorstand/antragsteller/${konto.id}` }} />
    </Suspense>
  );
}

/** Admin: Detailansicht eines Antrags aus Sicht des Antragstellers – nur lesend. */
export function AntragstellerAntragAnsicht() {
  const { benutzerId } = useParams<{ benutzerId: string }>();
  return <KontoDetail ansicht={{ benutzerId, zurueck: `/stiftungsvorstand/antragsteller/${benutzerId}` }} />;
}
