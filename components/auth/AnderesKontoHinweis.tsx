"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { abmelden } from "@/lib/auth";
import { Button } from "../ui/Button";
import { Hinweisbox } from "../ui/Diverses";

/**
 * Erscheint, wenn ein Link (z. B. aus einer E-Mail) zu einem Bereich führt,
 * der für die andere Rolle bestimmt ist. Bietet an, sich abzumelden und mit
 * dem passenden Konto direkt zum Ziel zu gelangen.
 */
export function AnderesKontoHinweis({ fuer }: { fuer: "stiftungsrat" | "antragsteller" }) {
  const params = useSearchParams();
  const router = useRouter();
  const [laedt, setLaedt] = useState(false);
  const weiter = params.get("weiter");
  if (params.get("hinweis") !== "anderes-konto" || !weiter?.startsWith("/") || weiter.startsWith("//")) return null;

  async function wechseln() {
    setLaedt(true);
    await abmelden();
    router.push(`/login?weiter=${encodeURIComponent(weiter!)}`);
    router.refresh();
  }

  return (
    <div className="mb-10">
      <Hinweisbox art="warn" rolle="status">
        <p>
          {fuer === "stiftungsrat"
            ? "Der aufgerufene Link führt in den Bereich des Stiftungsrats. Sie sind derzeit als Antragsteller angemeldet."
            : "Der aufgerufene Link führt in den Bereich eines Antragstellers. Sie sind derzeit als Mitglied des Stiftungsrats angemeldet."}
        </p>
        <div className="mt-4">
          <Button variante="sekundaer" onClick={wechseln} disabled={laedt}>
            {laedt ? "Wird abgemeldet …" : fuer === "stiftungsrat" ? "Abmelden und als Stiftungsrat anmelden" : "Abmelden und mit anderem Konto anmelden"}
          </Button>
        </div>
      </Hinweisbox>
    </div>
  );
}
