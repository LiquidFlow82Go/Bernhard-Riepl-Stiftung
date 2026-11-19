"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loescheAntrag } from "@/lib/email";
import type { Antrag } from "@/lib/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Textfeld } from "../ui/Feld";

/** Admin: Antrag endgültig löschen. Bestätigung durch Eingabe der Antragsnummer. */
export function AntragLoeschen({ antrag }: { antrag: Antrag }) {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [eingabe, setEingabe] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  function schliessen() {
    if (laeuft) return;
    setOffen(false);
    setEingabe("");
    setFehler("");
  }

  async function loeschen() {
    if (eingabe.trim() !== antrag.nummer) {
      setFehler(`Bitte geben Sie genau ${antrag.nummer} ein.`);
      document.getElementById("loeschen-nummer")?.focus();
      return;
    }
    setLaeuft(true);
    setFehler("");
    const r = await loescheAntrag(antrag.id, eingabe.trim());
    if (!r.ok) {
      setLaeuft(false);
      setFehler(r.fehler);
      document.getElementById("loeschen-nummer")?.focus();
      return;
    }
    router.push(`/stiftungsrat?geloescht=${encodeURIComponent(antrag.nummer)}`);
  }

  return (
    <section aria-labelledby="loeschen-titel" className="border border-fehler/40 bg-neutral-100 p-6">
      <h2 id="loeschen-titel" className="text-2xl leading-snug">Antrag löschen</h2>
      <p className="mt-2 text-sm text-neutral-700">
        Nur für Admins. Löscht den Antrag mit allen Dokumenten, Absagen, Bewilligungen und E-Mail-Protokollen endgültig.
      </p>
      <div className="mt-4">
        <Button variante="gefahr" onClick={() => setOffen(true)} aria-haspopup="dialog" className="w-full">
          Antrag löschen …
        </Button>
      </div>

      <Dialog offen={offen} onSchliessen={schliessen} titel="Antrag endgültig löschen?" beschreibung={`Antrag ${antrag.nummer} · ${antrag.daten.projekt.titel}`}>
        <div className="grid gap-6">
          <div className="border-l-4 border-fehler bg-[#b3361a12] px-5 py-4 text-neutral-800">
            Der Antrag, alle hochgeladenen Dateien, Absagen, Bewilligungen und Einträge im E-Mail-Protokoll werden
            unwiderruflich gelöscht. Der Antragsteller wird nicht benachrichtigt. Die Antragsnummer wird nicht neu vergeben.
          </div>
          <Textfeld
            id="loeschen-nummer"
            label={`Zur Bestätigung die Antragsnummer ${antrag.nummer} eingeben`}
            value={eingabe}
            onChange={(e) => setEingabe(e.target.value)}
            autoComplete="off"
            fehler={fehler || undefined}
            pflicht
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variante="ghost" onClick={schliessen} disabled={laeuft}>Abbrechen</Button>
            <Button variante="gefahr" onClick={loeschen} disabled={laeuft}>
              {laeuft ? "Wird gelöscht …" : "Endgültig löschen"}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
