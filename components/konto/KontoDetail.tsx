"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ladeAntrag } from "@/lib/antraege";
import { formatEuro } from "@/lib/betrag";
import { datumDe } from "@/lib/format";
import type { Antrag } from "@/lib/types";
import { AntragAnsicht } from "../antrag/AntragAnsicht";
import { useAuth } from "../auth/AuthProvider";
import { Hinweisbox, Laden, StatusBadge } from "../ui/Diverses";
import { DokumentAktionen, PdfButton, Zurueck } from "./Gemeinsam";

export function KontoDetail() {
  const { id } = useParams<{ id: string }>();
  const { benutzer } = useAuth();
  const [antrag, setAntrag] = useState<Antrag | null | undefined>(undefined);

  useEffect(() => {
    ladeAntrag(id)
      .then((a) => setAntrag(a && a.benutzerId === benutzer?.id ? a : null))
      .catch(() => setAntrag(null));
  }, [id, benutzer]);

  if (antrag === undefined) return <Laden />;
  if (antrag === null)
    return (
      <div className="container-site py-20">
        <Zurueck href="/konto">Meine Anträge</Zurueck>
        <h1 className="mt-6 text-4xl">Antrag nicht gefunden</h1>
      </div>
    );

  return (
    <div className="container-site py-12 lg:py-20">
      <Zurueck href="/konto">Meine Anträge</Zurueck>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <p className="caps text-sm text-neutral-700 mb-3 tabular-nums">Antrag {antrag.nummer}</p>
          <h1 className="text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125]">{antrag.daten.projekt.titel}</h1>
        </div>
        <PdfButton antrag={antrag} />
      </div>

      <dl className="mt-10 grid gap-6 sm:grid-cols-3 border-y border-neutral-400 py-6">
        <div>
          <dt className="text-sm text-neutral-700">Status</dt>
          <dd className="mt-2"><StatusBadge status={antrag.status} /></dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-700">Eingereicht am</dt>
          <dd className="mt-1 text-neutral-800">{datumDe(antrag.eingereichtAm, true)}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-700">Zuletzt aktualisiert</dt>
          <dd className="mt-1 text-neutral-800">{datumDe(antrag.aktualisiertAm, true)}</dd>
        </div>
      </dl>

      {antrag.status === "bewilligt" && (
        <div className="mt-8">
          <Hinweisbox art="ok">
            Der Stiftungsrat hat Ihren Antrag bewilligt. Bewilligter Betrag: <strong className="font-medium">{formatEuro(antrag.bewilligterBetrag)}</strong>
          </Hinweisbox>
        </div>
      )}
      {antrag.status === "abgelehnt" && antrag.absage && (
        <div className="mt-8">
          <Hinweisbox art="info">
            Der Stiftungsrat hat Ihren Antrag am {datumDe(antrag.absage.datum, true)} abgelehnt. Die Begründung haben Sie per E-Mail erhalten.
          </Hinweisbox>
        </div>
      )}

      <h2 className="mt-16 mb-8 text-[30px] leading-[1.2]">Ihre Angaben</h2>
      <p className="-mt-4 mb-10 text-sm text-neutral-700">Eingereichte Anträge können nicht mehr bearbeitet werden. Bei Änderungen wenden Sie sich bitte an die Stiftung.</p>
      <AntragAnsicht
        daten={antrag.daten}
        bewilligt={antrag.status === "bewilligt" ? antrag.bewilligterBetrag : undefined}
        dokumente={antrag.dokumente.map((d) => ({ ...d, aktionen: <DokumentAktionen d={d} /> }))}
      />
    </div>
  );
}
