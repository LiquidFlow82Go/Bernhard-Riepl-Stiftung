"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ladeAlleAntraege, verfuegbareJahre } from "@/lib/antraege";
import { betrag, formatEuro } from "@/lib/betrag";
import { datumDe } from "@/lib/format";
import { STATUS_LABEL, type Antrag, type AntragStatus } from "@/lib/types";
import { AnderesKontoHinweis } from "../auth/AnderesKontoHinweis";
import { useAuth } from "../auth/AuthProvider";
import { eingabeKlassen } from "../ui/Feld";
import { Hinweisbox, Laden, StatusBadge } from "../ui/Diverses";

const SELECT =
  "h-12 w-full rounded-pill border border-neutral-700 bg-neutral-100 px-[18px] pr-10 text-neutral-800 appearance-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%230f0b08%22 stroke-width=%221.3%22/></svg>')] bg-[length:12px] bg-[right_18px_center] bg-no-repeat";

export function AntragTabelle() {
  const { benutzer } = useAuth();
  const [jahre, setJahre] = useState<number[]>([]);
  const [jahr, setJahr] = useState<number | "alle">("alle");
  const [status, setStatus] = useState<AntragStatus | "alle">("alle");
  const [suche, setSuche] = useState("");
  const [liste, setListe] = useState<Antrag[] | null>(null);
  const [alle, setAlle] = useState<Antrag[]>([]);
  const [ladefehler, setLadefehler] = useState(false);

  useEffect(() => {
    verfuegbareJahre().then(setJahre).catch(() => {});
    ladeAlleAntraege().then(setAlle).catch(() => setLadefehler(true));
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => ladeAlleAntraege({ jahr, status, suche }).then(setListe).catch(() => setLadefehler(true)),
      250,
    );
    return () => clearTimeout(t);
  }, [jahr, status, suche]);

  const zaehle = (s: AntragStatus) => alle.filter((a) => a.status === s).length;

  return (
    <div className="container-site py-12 lg:py-20">
      <p className="caps text-sm text-neutral-700 mb-3">Stiftungsrat · {benutzer?.name}</p>
      <h1 className="text-[44px] leading-[1.1] lg:text-[60px] lg:leading-none">Förderanträge</h1>
      <div className="mt-8 -mb-4 empty:hidden">
        <AnderesKontoHinweis fuer="antragsteller" />
      </div>

      <dl className="mt-10 grid grid-cols-2 md:grid-cols-4 border-y border-neutral-400">
        {(Object.keys(STATUS_LABEL) as AntragStatus[]).map((s, i) => (
          <div key={s} className={`py-5 ${i > 0 ? "md:pl-6 md:border-l border-neutral-400" : ""} ${i % 2 === 1 ? "pl-6 border-l md:border-l" : ""}`}>
            <dt className="text-sm text-neutral-700">{STATUS_LABEL[s]}</dt>
            <dd className="mt-1 font-display font-extralight text-[36px] leading-none text-neutral-800 tabular-nums">{zaehle(s)}</dd>
          </div>
        ))}
      </dl>

      <search className="mt-10 grid gap-5 md:grid-cols-[1fr_1fr_2fr]" aria-label="Anträge filtern">
        <div className="flex flex-col gap-2">
          <label htmlFor="filter-jahr" className="text-sm font-medium text-neutral-800">Jahr</label>
          <select id="filter-jahr" className={SELECT} value={jahr} onChange={(e) => setJahr(e.target.value === "alle" ? "alle" : Number(e.target.value))}>
            <option value="alle">Alle Jahre</option>
            {jahre.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="filter-status" className="text-sm font-medium text-neutral-800">Status</label>
          <select id="filter-status" className={SELECT} value={status} onChange={(e) => setStatus(e.target.value as AntragStatus | "alle")}>
            <option value="alle">Alle Status</option>
            {(Object.keys(STATUS_LABEL) as AntragStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="filter-suche" className="text-sm font-medium text-neutral-800">Suche</label>
          <input id="filter-suche" type="search" className={eingabeKlassen} placeholder="Nummer, Antragsteller oder Projekt" value={suche} onChange={(e) => setSuche(e.target.value)} />
        </div>
      </search>

      <p role="status" className="mt-8 mb-4 text-sm text-neutral-700">
        {liste ? `${liste.length} ${liste.length === 1 ? "Antrag" : "Anträge"} gefunden` : ""}
      </p>

      {ladefehler ? (
        <Hinweisbox art="fehler" rolle="alert">Die Anträge konnten nicht geladen werden. Bitte laden Sie die Seite neu.</Hinweisbox>
      ) : !liste ? (
        <Laden />
      ) : liste.length === 0 ? (
        <p className="py-12 border-y border-neutral-400 text-lg">Keine Anträge für diese Auswahl.</p>
      ) : (
        <>
        <ul className="md:hidden border-t border-neutral-400">
          {liste.map((a) => (
            <li key={a.id} className="border-b border-neutral-400">
              <Link href={`/stiftungsrat/antraege/${a.id}`} className="block py-5">
                <span className="flex items-center justify-between gap-4">
                  <span className="tabular-nums text-neutral-800 underline underline-offset-4">{a.nummer}</span>
                  <StatusBadge status={a.status} />
                </span>
                <span className="block mt-2 text-lg text-neutral-800">{a.daten.projekt.titel}</span>
                <span className="block mt-1 text-sm text-neutral-700">{a.daten.antragsteller.name}</span>
                <span className="block mt-1 text-sm text-neutral-700">
                  {datumDe(a.eingereichtAm)} · beantragt {formatEuro(betrag(a.daten.finanzierung.stiftung))}
                  {a.bewilligterBetrag != null ? ` · bewilligt ${formatEuro(a.bewilligterBetrag)}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden md:block overflow-x-auto -mx-6 px-6">
          <table className="tabelle w-full min-w-[860px]">
            <caption className="sr-only">Alle Förderanträge, neueste zuerst</caption>
            <thead>
              <tr>
                <th scope="col">Nummer</th>
                <th scope="col">Antragsteller</th>
                <th scope="col">Projekt</th>
                <th scope="col">Eingang</th>
                <th scope="col" className="!text-right">Beantragt</th>
                <th scope="col" className="!text-right">Bewilligt</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((a) => (
                <tr key={a.id} className="hover:bg-neutral-100">
                  <td className="tabular-nums whitespace-nowrap">
                    <Link href={`/stiftungsrat/antraege/${a.id}`} className="text-neutral-800 underline underline-offset-4">
                      {a.nummer}
                      <span className="sr-only">: {a.daten.projekt.titel} öffnen</span>
                    </Link>
                  </td>
                  <td className="text-neutral-800">{a.daten.antragsteller.name}</td>
                  <td>{a.daten.projekt.titel}</td>
                  <td className="whitespace-nowrap">{datumDe(a.eingereichtAm)}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">{formatEuro(betrag(a.daten.finanzierung.stiftung))}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">{a.bewilligterBetrag != null ? formatEuro(a.bewilligterBetrag) : "–"}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
