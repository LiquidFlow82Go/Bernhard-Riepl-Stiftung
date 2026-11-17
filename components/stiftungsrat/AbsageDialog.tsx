"use client";

import { useEffect, useState } from "react";
import { fuelleVorlage, type AbsageVorlage } from "@/content/absageVorlagen";
import { ladeAntrag } from "@/lib/antraege";
import { betrag, formatEuro } from "@/lib/betrag";
import { sendeAbsage } from "@/lib/email";
import { datumDe } from "@/lib/format";
import type { Antrag } from "@/lib/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Textbereich, Textfeld } from "../ui/Feld";
import { Hinweisbox } from "../ui/Diverses";

export function AbsageDialog({
  antrag, vorlage, onSchliessen, onGesendet,
}: {
  antrag: Antrag;
  vorlage: AbsageVorlage | null;
  onSchliessen: () => void;
  onGesendet: (a: Antrag) => void;
}) {
  const [betreff, setBetreff] = useState("");
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [sendet, setSendet] = useState(false);
  const [versandFehler, setVersandFehler] = useState("");

  useEffect(() => {
    if (!vorlage) return;
    const A = antrag.daten.antragsteller;
    const kontext = {
      institution: A.name,
      projekttitel: antrag.daten.projekt.titel,
      antragsnummer: antrag.nummer,
      eingangsdatum: datumDe(antrag.eingereichtAm, true),
      betrag: formatEuro(betrag(antrag.daten.finanzierung.stiftung)),
    };
    setBetreff(fuelleVorlage(vorlage.betreff, kontext));
    setText(fuelleVorlage(vorlage.text, kontext));
    setFehler({});
    setVersandFehler("");
  }, [vorlage, antrag]);

  async function senden() {
    const f: Record<string, string> = {};
    if (!betreff.trim()) f.betreff = "Bitte geben Sie einen Betreff an.";
    if (!text.trim()) f.text = "Der Absagetext darf nicht leer sein.";
    setFehler(f);
    setVersandFehler("");
    if (Object.keys(f).length) {
      document.getElementById(`absage-${Object.keys(f)[0]}`)?.focus();
      return;
    }
    if (!vorlage) return;
    setSendet(true);
    const r = await sendeAbsage({ antragId: antrag.id, grundId: vorlage.id, betreff, text });
    if (!r.ok) {
      setSendet(false);
      setVersandFehler(r.fehler);
      requestAnimationFrame(() => document.getElementById("absage-versandfehler")?.focus());
      return;
    }
    const neu = await ladeAntrag(antrag.id).catch(() => null);
    setSendet(false);
    if (neu) onGesendet(neu);
    else onSchliessen();
  }

  const offenerPlatzhalter = /\[[^\]]+\]/.test(text);

  return (
    <Dialog offen={!!vorlage} onSchliessen={onSchliessen} titel="Absage senden" beschreibung={vorlage ? `Ausschlussgrund: ${vorlage.titel}` : undefined} breite="max-w-3xl">
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-medium text-neutral-800">Empfänger</p>
          <p className="mt-1 text-neutral-800">{antrag.kontoEmail ?? "Konto-Adresse des Antragstellers"}</p>
          <p className="mt-1 text-sm text-neutral-700">Bestätigte Konto-Adresse des Antragstellers. Eine Blindkopie geht an das Postfach der Stiftung.</p>
        </div>
        <Textfeld id="absage-betreff" label="Betreff" value={betreff} onChange={(e) => setBetreff(e.target.value)} fehler={fehler.betreff} pflicht />
        <Textbereich id="absage-text" label="Nachricht" value={text} onChange={(e) => setText(e.target.value)} fehler={fehler.text} pflicht rows={14} className="[&_textarea]:min-h-72" />
        {offenerPlatzhalter && (
          <Hinweisbox art="warn">Der Text enthält noch einen Platzhalter in eckigen Klammern. Bitte ergänzen oder entfernen.</Hinweisbox>
        )}
        {versandFehler && (
          <div id="absage-versandfehler" tabIndex={-1} role="alert" className="border-l-4 border-fehler bg-[#b3361a12] px-5 py-4 text-neutral-800 focus:outline-none">
            {versandFehler}
          </div>
        )}
        <p className="text-sm text-neutral-700">
          „Absage senden“ verschickt die E-Mail über das Postfach der Stiftung. Erst nach erfolgreichem Versand wird der Status auf „Abgelehnt“ gesetzt und der Text gespeichert.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variante="ghost" onClick={onSchliessen}>Abbrechen</Button>
          <Button variante="gefahr" onClick={senden} disabled={sendet}>{sendet ? "Wird gesendet …" : "Absage senden"}</Button>
        </div>
      </div>
    </Dialog>
  );
}
