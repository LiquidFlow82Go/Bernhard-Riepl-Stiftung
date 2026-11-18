"use client";

import Link from "next/link";
import { useState } from "react";
import { dokumentAnsehen, dokumentHerunterladen, ladeBlobHerunter } from "@/lib/dokumente";
import { erzeugeAntragPdf, pdfDateiname } from "@/lib/pdf";
import { datumDe } from "@/lib/format";
import type { Antrag, Dokument } from "@/lib/types";
import { Button } from "../ui/Button";

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
  return (
    <span className="flex gap-5 shrink-0">
      <button type="button" onClick={() => dokumentAnsehen(d)} className="text-sm underline underline-offset-4 text-neutral-800 cursor-pointer min-h-11 px-1">
        Ansehen<span className="sr-only">: {d.dateiname} (öffnet in neuem Tab)</span>
      </button>
      <button type="button" onClick={() => dokumentHerunterladen(d)} className="text-sm underline underline-offset-4 text-neutral-800 cursor-pointer min-h-11 px-1">
        Herunterladen<span className="sr-only">: {d.dateiname}</span>
      </button>
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
