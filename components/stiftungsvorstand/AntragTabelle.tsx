"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ladeAlleAntraege, neueUnterlagenSeit, verfuegbareJahre } from "@/lib/antraege";
import { betrag, formatEuro } from "@/lib/betrag";
import { anzeigeName, datumDe } from "@/lib/format";
import { STATUS_LABEL, type Antrag, type AntragStatus } from "@/lib/types";
import { AnderesKontoHinweis } from "../auth/AnderesKontoHinweis";
import { useAuth } from "../auth/AuthProvider";
import { eingabeKlassen } from "../ui/Feld";
import { Hinweisbox, Laden, StatusBadge } from "../ui/Diverses";
import { SELECT, SortAuswahl, SortKopf, useSortierung } from "./Liste";


export function AntragTabelle() {
  const { benutzer } = useAuth();
  const geloescht = useSearchParams().get("geloescht");
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
  const sort = useSortierung(
    liste,
    {
      nummer: (a: Antrag) => a.nummer,
      antragsteller: (a: Antrag) => a.daten.antragsteller.name,
      projekt: (a: Antrag) => a.daten.projekt.titel,
      eingang: (a: Antrag) => a.eingereichtAm,
      beantragt: (a: Antrag) => betrag(a.daten.finanzierung.stiftung),
      bewilligt: (a: Antrag) => a.bewilligterBetrag,
      status: (a: Antrag) => STATUS_LABEL[a.status],
    },
    { schluessel: "nummer", richtung: "ab" },
  );
  type Sp = typeof sort.schluessel;
  const kopf = (k: Sp, label: string, rechts?: boolean) => (
    <SortKopf k={k} aktiv={sort.schluessel} richtung={sort.richtung} onSort={sort.umschalten} rechts={rechts}>{label}</SortKopf>
  );

  return (
    <div className="container-site pt-8 pb-12 lg:pt-12 lg:pb-20">
      <p className="caps text-sm text-neutral-700 mb-3">
        {benutzer?.rolle === "admin" ? "Admin" : "Stiftungsvorstand"} – {anzeigeName(benutzer)}
      </p>
      <h1 className="text-[44px] leading-[1.1] lg:text-[60px] lg:leading-none">Eingegangene Anträge</h1>
      {benutzer?.rolle === "admin" && (
        <p className="mt-4">
          <Link href="/stiftungsvorstand/antragsteller" className="inline-flex items-center min-h-11 underline underline-offset-4 text-neutral-800">
            Zur Ansicht Antragsteller (nur lesend)
          </Link>
        </p>
      )}
      <div className="mt-8 -mb-4 empty:hidden">
        <AnderesKontoHinweis fuer="antragsteller" />
      </div>
      {geloescht && (
        <div className="mt-8">
          <Hinweisbox art="ok" rolle="status">Antrag {geloescht} wurde endgültig gelöscht.</Hinweisbox>
        </div>
      )}

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
        <div className="mb-4">
          <SortAuswahl
            id="sort-antraege"
            optionen={[
              { k: "nummer", label: "Nummer" },
              { k: "eingang", label: "Eingang" },
              { k: "antragsteller", label: "Antragsteller" },
              { k: "beantragt", label: "Beantragt" },
              { k: "status", label: "Status" },
            ]}
            schluessel={sort.schluessel}
            richtung={sort.richtung}
            onChange={sort.setze}
          />
        </div>
        <ul className="md:hidden border-t border-neutral-400">
          {(sort.sortiert ?? []).map((a) => (
            <li key={a.id} className="border-b border-neutral-400">
              <Link href={`/stiftungsvorstand/antraege/${a.id}`} className="block py-5">
                <span className="flex items-center justify-between gap-4">
                  <span className="tabular-nums text-neutral-800 underline underline-offset-4">{a.nummer}</span>
                  <StatusBadge status={a.status} />
                </span>
                {neueUnterlagenSeit(a) && <NeuBadge seit={neueUnterlagenSeit(a)!} />}
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
            <caption className="sr-only">Eingegangene Förderanträge; Spaltenköpfe sortieren die Liste</caption>
            <thead>
              <tr>
                {kopf("nummer", "Nummer")}
                {kopf("antragsteller", "Antragsteller")}
                {kopf("projekt", "Projekt")}
                {kopf("eingang", "Eingang")}
                {kopf("beantragt", "Beantragt", true)}
                {kopf("bewilligt", "Bewilligt", true)}
                {kopf("status", "Status")}
              </tr>
            </thead>
            <tbody>
              {(sort.sortiert ?? []).map((a) => (
                <tr key={a.id} className="hover:bg-neutral-100">
                  <td className="tabular-nums whitespace-nowrap">
                    <Link href={`/stiftungsvorstand/antraege/${a.id}`} className="text-neutral-800 underline underline-offset-4">
                      {a.nummer}
                      <span className="sr-only">: {a.daten.projekt.titel} öffnen</span>
                    </Link>
                  </td>
                  <td className="text-neutral-800">{a.daten.antragsteller.name}</td>
                  <td>{a.daten.projekt.titel}</td>
                  <td className="whitespace-nowrap">{datumDe(a.eingereichtAm)}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">{formatEuro(betrag(a.daten.finanzierung.stiftung))}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">{a.bewilligterBetrag != null ? formatEuro(a.bewilligterBetrag) : "–"}</td>
                  <td>
                    <StatusBadge status={a.status} />
                    {neueUnterlagenSeit(a) && <NeuBadge seit={neueUnterlagenSeit(a)!} />}
                  </td>
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

function NeuBadge({ seit }: { seit: string }) {
  return (
    <span className="mt-2 block w-fit rounded-pill bg-herbstgold/20 border border-herbstgold px-2.5 py-0.5 text-xs text-neutral-800">
      Neue Unterlagen seit {datumDe(seit)}
    </span>
  );
}
