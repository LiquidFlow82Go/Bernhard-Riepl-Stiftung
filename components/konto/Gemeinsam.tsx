"use client";

import Link from "next/link";
import { useState } from "react";
import { dokumentAnsehen, dokumentHerunterladen, ladeBlobHerunter } from "@/lib/dokumente";
import { erzeugeAntragPdf, pdfDateiname } from "@/lib/pdf";
import { datumDe } from "@/lib/format";
import type { Antrag, Dokument } from "@/lib/types";
import { Button } from "../ui/Button";
import { Hinweisbox } from "../ui/Diverses";

export function PdfButton({ antrag, variante = "primaer" }: { antrag: Antrag; variante?: "primaer" | "sekundaer" }) {
  const [laedt, setLaedt] = useState(false);
  async function los() {
    setLaedt(true);
    try {
      const blob = await erzeugeAntragPdf({
        daten: antrag.daten,
        nummer: antrag.nummer,
        eingereichtAm: antrag.eingereichtAm,
        bewilligterBetrag: antrag.bewilligterBetrag,
        dokumente: antrag.dokumente,
      });
      ladeBlobHerunter(blob, pdfDateiname(antrag.nummer, antrag.daten.projekt.titel));
    } finally {
      setLaedt(false);
    }
  }
  return (
    <Button variante={variante} onClick={los} disabled={laedt}>
      {laedt ? "PDF wird erstellt …" : "Antrag als PDF"}
    </Button>
  );
}

export function DokumentAktionen({ d }: { d: Dokument }) {
  const [fehler, setFehler] = useState("");
  const los = (f: (d: Dokument) => Promise<void>) => () => {
    setFehler("");
    f(d).catch((e: Error) => setFehler(e.message));
  };
  return (
    <span className="flex flex-wrap gap-x-5 shrink-0">
      <button type="button" onClick={los(dokumentAnsehen)} className="text-sm underline underline-offset-4 text-neutral-800 cursor-pointer min-h-11 px-1">
        Ansehen<span className="sr-only">: {d.dateiname} (öffnet in neuem Tab)</span>
      </button>
      <button type="button" onClick={los(dokumentHerunterladen)} className="text-sm underline underline-offset-4 text-neutral-800 cursor-pointer min-h-11 px-1">
        Herunterladen<span className="sr-only">: {d.dateiname}</span>
      </button>
      {fehler && <span role="alert" className="text-sm text-fehler">{fehler}</span>}
    </span>
  );
}

export function Zurueck({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm caps text-neutral-800 hover:underline underline-offset-4">
      <span aria-hidden="true">←</span> {children}
    </Link>
  );
}

/** Dokumente für die Ansicht, nachgereichte mit Datum gekennzeichnet. */
export function ansichtDokumente(dokumente: Dokument[]) {
  return dokumente.map((d) => ({
    ...d,
    vermerk: d.nachgereicht ? `nachgereicht am ${datumDe(d.hochgeladenAm)}` : undefined,
    aktionen: <DokumentAktionen d={d} />,
  }));
}

/** Hinweis für die lesende Antragsteller-Ansicht (nur Admin). */
export function NurLesenHinweis() {
  return (
    <Hinweisbox art="info">
      <strong className="font-medium">Ansicht Antragsteller – nur lesend.</strong> Sie sehen diesen Bereich so, wie der
      Antragsteller ihn sieht. Änderungen und Uploads sind hier nicht möglich.
    </Hinweisbox>
  );
}
