"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ladeEigeneAntraege } from "@/lib/antraege";
import { formatEuro, betrag } from "@/lib/betrag";
import { datumDe } from "@/lib/format";
import type { Antrag } from "@/lib/types";
import { useAuth } from "../auth/AuthProvider";
import { ButtonLink } from "../ui/Button";
import { Hinweisbox, Laden, StatusBadge } from "../ui/Diverses";

export function KontoUebersicht() {
  const { benutzer } = useAuth();
  const neu = useSearchParams().get("neu");
  const [liste, setListe] = useState<Antrag[] | null>(null);
  const [ladefehler, setLadefehler] = useState(false);

  useEffect(() => {
    if (benutzer) ladeEigeneAntraege(benutzer.id).then(setListe).catch(() => setLadefehler(true));
  }, [benutzer]);

  return (
    <div className="container-site py-12 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
        <div>
          <p className="caps text-sm text-neutral-700 mb-3">{benutzer?.institution ?? benutzer?.name}</p>
          <h1 className="text-[44px] leading-[1.1] lg:text-[60px] lg:leading-none">Meine Anträge</h1>
        </div>
        <ButtonLink href="/antrag" gross>
          Neuen Antrag stellen
        </ButtonLink>
      </div>

      {neu && (
        <div className="mb-10">
          <Hinweisbox art="ok" rolle="status">
            Ihr Konto wurde angelegt. Sie können jetzt Ihren ersten Förderantrag stellen.
          </Hinweisbox>
        </div>
      )}

      {ladefehler ? (
        <Hinweisbox art="fehler" rolle="alert">Ihre Anträge konnten nicht geladen werden. Bitte laden Sie die Seite neu.</Hinweisbox>
      ) : !liste ? (
        <Laden />
      ) : liste.length === 0 ? (
        <p className="py-16 text-lg border-y border-neutral-400">
          Sie haben noch keine Anträge gestellt.{" "}
          <Link href="/antrag" className="underline underline-offset-4 text-neutral-800">
            Jetzt Antrag stellen
          </Link>
        </p>
      ) : (
        <>
          {/* Tabelle ab Tablet */}
          <table className="tabelle w-full hidden md:table">
            <caption className="sr-only">Ihre Förderanträge mit Nummer, Datum und Status</caption>
            <thead>
              <tr>
                <th scope="col">Nummer</th>
                <th scope="col">Projekt</th>
                <th scope="col">Eingereicht</th>
                <th scope="col" className="!text-right">Beantragt</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((a) => (
                <tr key={a.id} className="hover:bg-neutral-100">
                  <td className="tabular-nums whitespace-nowrap">
                    <Link href={`/konto/antraege/${a.id}`} className="text-neutral-800 underline underline-offset-4">
                      {a.nummer}
                    </Link>
                  </td>
                  <td className="text-neutral-800">{a.daten.projekt.titel}</td>
                  <td className="whitespace-nowrap">{datumDe(a.eingereichtAm)}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">{formatEuro(betrag(a.daten.finanzierung.stiftung))}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Liste auf dem Smartphone */}
          <ul className="md:hidden border-t border-neutral-400">
            {liste.map((a) => (
              <li key={a.id} className="border-b border-neutral-400">
                <Link href={`/konto/antraege/${a.id}`} className="block py-5">
                  <span className="flex items-center justify-between gap-4">
                    <span className="tabular-nums text-neutral-800 underline underline-offset-4">{a.nummer}</span>
                    <StatusBadge status={a.status} />
                  </span>
                  <span className="block mt-2 text-lg text-neutral-800">{a.daten.projekt.titel}</span>
                  <span className="block mt-1 text-sm text-neutral-700">Eingereicht am {datumDe(a.eingereichtAm)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
