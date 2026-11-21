"use client";

import { useState } from "react";
import { ladeBlobHerunter } from "@/lib/dokumente";
import type { Initiative } from "@/lib/initiativeTypen";
import { Button } from "../ui/Button";

/** PDF „Interne Projektdokumentation – Initiativförderung“ herunterladen. */
export function InitiativPdfKnopf({ initiative, klein, variante = "sekundaer" }: { initiative: Initiative; klein?: boolean; variante?: "primaer" | "sekundaer" }) {
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState("");
  async function los() {
    setLaedt(true);
    setFehler("");
    try {
      const { erzeugeInitiativPdf, initiativPdfDateiname } = await import("@/lib/pdfInitiative");
      const blob = await erzeugeInitiativPdf({ daten: initiative.daten, aktenzeichen: initiative.aktenzeichen });
      ladeBlobHerunter(blob, initiativPdfDateiname(initiative.aktenzeichen, initiative.projektTitel));
    } catch {
      setFehler("Das PDF konnte nicht erstellt werden.");
    }
    setLaedt(false);
  }
  if (klein)
    return (
      <span className="inline-flex flex-col items-end">
        <button
          type="button"
          onClick={los}
          disabled={laedt}
          className="inline-flex items-center gap-1.5 min-h-11 px-1 text-sm underline underline-offset-4 text-neutral-800 cursor-pointer disabled:opacity-60"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4"><path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2 13h12" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
          {laedt ? "Wird erstellt …" : "PDF"}
          <span className="sr-only"> der Initiative {initiative.aktenzeichen} herunterladen</span>
        </button>
        {fehler && <span role="alert" className="text-xs text-fehler">{fehler}</span>}
      </span>
    );
  return (
    <span className="inline-flex flex-col gap-1">
      <Button variante={variante} onClick={los} disabled={laedt}>
        {laedt ? "PDF wird erstellt …" : "PDF herunterladen"}
      </Button>
      {fehler && <span role="alert" className="text-sm text-fehler">{fehler}</span>}
    </span>
  );
}

/** Leeres Formular zum Ausdrucken. */
export function LeeresFormularKnopf() {
  const [laedt, setLaedt] = useState(false);
  async function los() {
    setLaedt(true);
    try {
      const m = await import("@/lib/pdfInitiative");
      const blob = await m.erzeugeInitiativPdf(m.leeresInitiativFormular());
      ladeBlobHerunter(blob, m.initiativPdfDateiname(undefined, ""));
    } finally {
      setLaedt(false);
    }
  }
  return (
    <Button variante="ghost" gross onClick={los} disabled={laedt}>
      {laedt ? "Wird erstellt …" : "Leeres Formular (PDF)"}
    </Button>
  );
}
