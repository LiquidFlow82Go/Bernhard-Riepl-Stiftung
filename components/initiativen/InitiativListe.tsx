"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatEuro } from "@/lib/betrag";
import { anzeigeName } from "@/lib/format";
import { ladeInitiativen } from "@/lib/initiativen";
import {
  EMPFAENGER,
  INITIATIV_STATUS,
  INITIATIV_STATUS_LABEL,
  personName,
  type EmpfaengerArt,
  type Initiative,
  type InitiativStatus,
} from "@/lib/initiativeTypen";
import { useAuth } from "../auth/AuthProvider";
import { ButtonLink } from "../ui/Button";
import { Hinweisbox, Laden } from "../ui/Diverses";
import { eingabeKlassen } from "../ui/Feld";
import { BereichSymbol, InitiativeKennzeichen } from "../stiftungsvorstand/Bereich";
import { SELECT, SortAuswahl, SortKopf, useSortierung } from "../stiftungsvorstand/Liste";
import { InitiativStatusBadge, tag } from "./Gemeinsam";
import { InitiativPdfKnopf, LeeresFormularKnopf } from "./PdfKnopf";

export function InitiativListe() {
  const { benutzer } = useAuth();
  const geloescht = useSearchParams().get("geloescht");
  const [alle, setAlle] = useState<Initiative[] | null>(null);
  const [fehler, setFehler] = useState(false);
  const [jahr, setJahr] = useState<number | "alle">("alle");
  const [status, setStatus] = useState<InitiativStatus | "alle">("alle");
  const [suche, setSuche] = useState("");
  const [empfaenger, setEmpfaenger] = useState<EmpfaengerArt | "alle">("alle");

  useEffect(() => {
    ladeInitiativen().then(setAlle).catch(() => setFehler(true));
  }, []);

  const jahre = useMemo(() => {
    const s = new Set((alle ?? []).map((i) => i.jahr));
    s.add(new Date().getFullYear());
    return [...s].sort((a, b) => b - a);
  }, [alle]);

  const liste = useMemo(() => {
    if (!alle) return null;
    const q = suche.trim().toLowerCase();
    return alle.filter(
      (i) =>
        (jahr === "alle" || i.jahr === jahr) &&
        (status === "alle" || i.status === status) &&
        (empfaenger === "alle" || i.empfaengerArt === empfaenger) &&
        (!q || [i.aktenzeichen, i.projektTitel, i.partnerName].some((t) => t.toLowerCase().includes(q))),
    );
  }, [alle, jahr, status, suche, empfaenger]);

  const sort = useSortierung(
    liste,
    {
      aktenzeichen: (i: Initiative) => i.aktenzeichen,
      datum: (i: Initiative) => i.datum,
      titel: (i: Initiative) => i.projektTitel,
      partner: (i: Initiative) => i.partnerName,
      betrag: (i: Initiative) => i.foerderbetrag,
      status: (i: Initiative) => INITIATIV_STATUS.indexOf(i.status),
      ersteller: (i: Initiative) => personName(i.erstelltVon),
    },
    { schluessel: "aktenzeichen", richtung: "ab" },
  );
  type Sp = typeof sort.schluessel;
  const kopf = (k: Sp, label: string, rechts?: boolean) => (
    <SortKopf k={k} aktiv={sort.schluessel} richtung={sort.richtung} onSort={sort.umschalten} rechts={rechts}>{label}</SortKopf>
  );
  const zaehle = (s: InitiativStatus) => (alle ?? []).filter((i) => i.status === s).length;

  return (
    <div className="container-site pt-8 pb-12 lg:pt-12 lg:pb-20">
      <p className="caps text-sm text-neutral-700 mb-3">
        {benutzer?.rolle === "admin" ? "Admin" : "Stiftungsvorstand"} – {anzeigeName(benutzer)}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="flex items-center gap-3 text-[44px] leading-[1.1] lg:text-[60px] lg:leading-none">
          <BereichSymbol art="initiativen" className="size-9 lg:size-12 text-[#8a3f0c] shrink-0" />
          Eigene Initiativen
        </h1>
        <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-3 max-sm:w-full">
          <LeeresFormularKnopf />
          <ButtonLink href="/stiftungsvorstand/initiativen/neu" gross>
            Neue Initiative anlegen
          </ButtonLink>
        </div>
      </div>
      <p className="mt-4 max-w-[70ch] text-base text-neutral-700">
        Förderungen, die der Stiftungsvorstand selbst anstößt – ohne Antrag von außen. Dokumentiert als „Interne
        Projektdokumentation – Initiativförderung“.
      </p>

      {geloescht && (
        <div className="mt-8">
          <Hinweisbox art="ok" rolle="status">Der Entwurf {geloescht} wurde gelöscht.</Hinweisbox>
        </div>
      )}

      {fehler ? (
        <div className="mt-10">
          <Hinweisbox art="fehler" rolle="alert">
            Die Initiativen konnten nicht geladen werden. Bitte laden Sie die Seite neu. Falls der Fehler bleibt: Sind die
            Datenbank-Migrationen für Eigene Initiativen eingespielt?
          </Hinweisbox>
        </div>
      ) : !alle ? (
        <Laden />
      ) : alle.length === 0 ? (
        <div className="mt-10 rounded-[22px] border border-[#e4c9a5] bg-neutral-100/70 px-6 py-10 md:px-10 max-w-3xl">
          <h2 className="text-2xl leading-snug">Noch keine Eigenen Initiativen</h2>
          <p className="mt-3 text-base">
            Wenn der Stiftungsvorstand selbst auf eine Gruppe, Einrichtung oder Person zugeht, die Unterstützung braucht,
            wird die Förderung hier angelegt und genauso sauber dokumentiert wie ein Antrag: Zweckbindung, Beschluss,
            Auszahlung und Verwendungsnachweis.
          </p>
          <div className="mt-6">
            <ButtonLink href="/stiftungsvorstand/initiativen/neu" gross>Neue Initiative anlegen</ButtonLink>
          </div>
        </div>
      ) : (
        <>
          <dl className="mt-10 grid grid-cols-2 md:grid-cols-4 border-y border-[#e4c9a5]">
            {INITIATIV_STATUS.map((s, i) => (
              <div key={s} className={`py-5 ${i > 0 ? "md:pl-6 md:border-l border-[#e4c9a5]" : ""} ${i % 2 === 1 ? "pl-6 border-l md:border-l" : ""}`}>
                <dt className="text-sm text-neutral-700">{INITIATIV_STATUS_LABEL[s]}</dt>
                <dd className="mt-1 font-display font-extralight text-[36px] leading-none text-neutral-800 tabular-nums">{zaehle(s)}</dd>
              </div>
            ))}
          </dl>

          <search className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_2fr]" aria-label="Initiativen filtern">
            <div className="flex flex-col gap-2">
              <label htmlFor="if-jahr" className="text-sm font-medium text-neutral-800">Jahr</label>
              <select id="if-jahr" className={SELECT} value={jahr} onChange={(e) => setJahr(e.target.value === "alle" ? "alle" : Number(e.target.value))}>
                <option value="alle">Alle Jahre</option>
                {jahre.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="if-status" className="text-sm font-medium text-neutral-800">Status</label>
              <select id="if-status" className={SELECT} value={status} onChange={(e) => setStatus(e.target.value as InitiativStatus | "alle")}>
                <option value="alle">Alle Status</option>
                {INITIATIV_STATUS.map((s) => <option key={s} value={s}>{INITIATIV_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="if-empfaenger" className="text-sm font-medium text-neutral-800">Empfänger</label>
              <select id="if-empfaenger" className={SELECT} value={empfaenger} onChange={(e) => setEmpfaenger(e.target.value as EmpfaengerArt | "alle")}>
                <option value="alle">Alle Empfänger</option>
                {EMPFAENGER.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="if-suche" className="text-sm font-medium text-neutral-800">Suche</label>
              <input id="if-suche" type="search" className={eingabeKlassen} placeholder="Aktenzeichen, Titel, Partner oder Initialen" value={suche} onChange={(e) => setSuche(e.target.value)} />
            </div>
          </search>

          <p role="status" className="mt-8 mb-4 text-sm text-neutral-700">
            {liste ? `${liste.length} ${liste.length === 1 ? "Initiative" : "Initiativen"} gefunden` : ""}
          </p>

          {liste && liste.length === 0 ? (
            <p className="py-12 border-y border-[#e4c9a5] text-lg">Keine Initiativen für diese Auswahl.</p>
          ) : (
            <>
              <div className="mb-4">
                <SortAuswahl
                  id="sort-initiativen"
                  optionen={[
                    { k: "aktenzeichen", label: "Aktenzeichen" },
                    { k: "datum", label: "Datum" },
                    { k: "titel", label: "Projekttitel" },
                    { k: "partner", label: "Partner" },
                    { k: "betrag", label: "Förderbetrag" },
                    { k: "status", label: "Status" },
                  ]}
                  schluessel={sort.schluessel}
                  richtung={sort.richtung}
                  onChange={sort.setze}
                />
              </div>
              <ul className="md:hidden border-t border-[#e4c9a5]">
                {(sort.sortiert ?? []).map((i) => (
                  <li key={i.id} className="border-b border-[#e4c9a5] py-5">
                    <Link href={`/stiftungsvorstand/initiativen/${i.id}`} className="block">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="tabular-nums text-neutral-800 underline underline-offset-4">{i.aktenzeichen}</span>
                        <InitiativStatusBadge status={i.status} />
                      </span>
                      <span className="mt-2 block"><InitiativeKennzeichen /></span>
                      <span className="block mt-2 text-lg text-neutral-800">{i.projektTitel || "(ohne Titel)"}</span>
                      <span className="block mt-1 text-sm text-neutral-700">{i.partnerName || "Partner noch offen"}</span>
                      <span className="block mt-1 text-sm text-neutral-700">
                        {tag(i.datum)} · {i.foerderbetrag != null ? formatEuro(i.foerderbetrag) : "Betrag offen"} · {personName(i.erstelltVon)}
                      </span>
                    </Link>
                    <div className="mt-2">
                      <InitiativPdfKnopf initiative={i} klein />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                <table className="tabelle w-full min-w-[980px]">
                  <caption className="sr-only">Eigene Initiativen; Spaltenköpfe sortieren die Liste</caption>
                  <thead>
                    <tr>
                      {kopf("aktenzeichen", "Aktenzeichen")}
                      {kopf("datum", "Datum")}
                      {kopf("titel", "Projekttitel")}
                      {kopf("partner", "Durchführungspartner")}
                      {kopf("betrag", "Förderbetrag", true)}
                      {kopf("status", "Status")}
                      {kopf("ersteller", "Erstellt von")}
                      <th scope="col"><span className="sr-only">PDF</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sort.sortiert ?? []).map((i) => (
                      <tr key={i.id} className="hover:bg-neutral-100/70">
                        <td className="whitespace-nowrap">
                          <Link href={`/stiftungsvorstand/initiativen/${i.id}`} className="tabular-nums text-neutral-800 underline underline-offset-4">
                            {i.aktenzeichen}
                            <span className="sr-only">: {i.projektTitel || "Initiative"} öffnen</span>
                          </Link>
                          <span className="block mt-1.5"><InitiativeKennzeichen /></span>
                        </td>
                        <td className="whitespace-nowrap">{tag(i.datum)}</td>
                        <td className="text-neutral-800">{i.projektTitel || <span className="italic text-neutral-700">ohne Titel</span>}</td>
                        <td>{i.partnerName}</td>
                        <td className="text-right tabular-nums whitespace-nowrap">{i.foerderbetrag != null ? formatEuro(i.foerderbetrag) : "–"}</td>
                        <td><InitiativStatusBadge status={i.status} /></td>
                        <td className="whitespace-nowrap">{personName(i.erstelltVon)}</td>
                        <td className="text-right"><InitiativPdfKnopf initiative={i} klein /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
