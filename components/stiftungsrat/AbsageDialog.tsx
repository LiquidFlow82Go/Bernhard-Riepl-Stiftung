"use client";

import { useEffect, useState } from "react";
import { fuelleVorlage, type AbsageVorlage } from "@/content/absageVorlagen";
import { lehneAntragAb } from "@/lib/antraege";
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
  const [an, setAn] = useState("");
  const [betreff, setBetreff] = useState("");
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [sendet, setSendet] = useState(false);

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
    setAn(A.email);
    setBetreff(fuelleVorlage(vorlage.betreff, kontext));
    setText(fuelleVorlage(vorlage.text, kontext));
    setFehler({});
  }, [vorlage, antrag]);

  async function senden() {
    const f: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(an.trim())) f.an = "Bitte geben Sie eine gültige Empfängeradresse an.";
    if (!betreff.trim()) f.betreff = "Bitte geben Sie einen Betreff an.";
    if (!text.trim()) f.text = "Der Absagetext darf nicht leer sein.";
    setFehler(f);
    if (Object.keys(f).length) {
      document.getElementById(`absage-${Object.keys(f)[0]}`)?.focus();
      return;
    }
    if (!vorlage) return;
    setSendet(true);
    const versand = await sendeAbsage({ an, betreff, text, antragId: antrag.id });
    try {
      if (versand.ok) {
        const neu = await lehneAntragAb(antrag.id, { grundId: vorlage.id, grundTitel: vorlage.titel, betreff, text, empfaenger: an });
        onGesendet(neu);
      }
    } catch {
      setFehler({ text: "Die Absage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut." });
    } finally {
      setSendet(false);
    }
  }

  const offenerPlatzhalter = /\[[^\]]+\]/.test(text);

  return (
    <Dialog offen={!!vorlage} onSchliessen={onSchliessen} titel="Absage senden" beschreibung={vorlage ? `Ausschlussgrund: ${vorlage.titel}` : undefined} breite="max-w-3xl">
      <div className="grid gap-6">
        <Textfeld id="absage-an" label="Empfänger" type="email" value={an} onChange={(e) => setAn(e.target.value)} fehler={fehler.an} pflicht />
        <Textfeld id="absage-betreff" label="Betreff" value={betreff} onChange={(e) => setBetreff(e.target.value)} fehler={fehler.betreff} pflicht />
        <Textbereich id="absage-text" label="Nachricht" value={text} onChange={(e) => setText(e.target.value)} fehler={fehler.text} pflicht rows={14} className="[&_textarea]:min-h-72" />
        {offenerPlatzhalter && (
          <Hinweisbox art="warn">Der Text enthält noch einen Platzhalter in eckigen Klammern. Bitte ergänzen oder entfernen.</Hinweisbox>
        )}
        <p className="text-sm text-neutral-700">
          „Absage senden“ setzt den Status auf „Abgelehnt“ und speichert Grund, Text und Datum. Der E-Mail-Versand über das Stiftungspostfach folgt in Phase 4 – bis dahin bitte die Absage zusätzlich manuell versenden.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variante="ghost" onClick={onSchliessen}>Abbrechen</Button>
          <Button variante="gefahr" onClick={senden} disabled={sendet}>{sendet ? "Wird gesendet …" : "Absage senden"}</Button>
        </div>
      </div>
    </Dialog>
  );
}
