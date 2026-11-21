"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ladeInitiative } from "@/lib/initiativen";
import type { Initiative } from "@/lib/initiativeTypen";
import { Zurueck } from "../konto/Gemeinsam";
import { Laden } from "../ui/Diverses";
import { InitiativFormular } from "./InitiativFormular";

/** Gespeicherten Entwurf bzw. Initiative im Formular fortsetzen. */
export function InitiativBearbeiten() {
  const { id } = useParams<{ id: string }>();
  const schritt = Number(useSearchParams().get("schritt") ?? 1) || 1;
  const [i, setI] = useState<Initiative | null | undefined>(undefined);
  useEffect(() => {
    ladeInitiative(id).then(setI).catch(() => setI(null));
  }, [id]);
  if (i === undefined) return <Laden />;
  if (i === null)
    return (
      <div className="container-site py-12">
        <Zurueck href="/stiftungsvorstand/initiativen">Alle Initiativen</Zurueck>
        <h1 className="mt-6 text-4xl">Initiative nicht gefunden</h1>
      </div>
    );
  return <InitiativFormular vorhanden={i} startSchritt={schritt} />;
}
