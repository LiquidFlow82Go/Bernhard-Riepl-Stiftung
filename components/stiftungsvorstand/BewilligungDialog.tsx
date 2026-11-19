"use client";

import { useEffect, useState } from "react";
import { fuelleVorlage } from "@/content/absageVorlagen";
import { BEWILLIGUNG_VORLAGE, offenePlatzhalter } from "@/content/mailVorlagen";
import { ladeAntrag } from "@/lib/antraege";
import { betrag, formatBetrag, formatEuro, normalisiereBetrag, parseBetrag } from "@/lib/betrag";
import { sendeBewilligung } from "@/lib/email";
import { datumDe } from "@/lib/format";
import type { Antrag } from "@/lib/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Fehlertext, Textbereich, Textfeld } from "../ui/Feld";
import { Hinweisbox } from "../ui/Diverses";

/**
 * Bewilligung mit vorgefertigter, bearbeitbarer E-Mail (wie der Absagedialog).
 * „Bewilligen und E-Mail senden“: Status erst nach erfolgreichem Versand.
 * „Nur bewilligen, keine E-Mail“: Status und Betrag ohne Versand.
 */
export function BewilligungDialog({
  antrag, offen, onSchliessen, onGespeichert,
}: {
  antrag: Antrag;
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: (a: Antrag, mitMail: boolean) => void;
}) {
  const [summe, setSumme] = useState("");
  const [betreff, setBetreff] = useState("");
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [laeuft, setLaeuft] = useState<"mail" | "ohne" | null>(null);
  const [serverFehler, setServerFehler] = useState("");
  const [letzterBetrag, setLetzterBetrag] = useState("");

  useEffect(() => {
    if (!offen) return;
    const vorschlag = betrag(antrag.daten.finanzierung.stiftung);
    const euro = formatEuro(vorschlag);
    const kontext = {
      institution: antrag.daten.antragsteller.name,
      projekttitel: antrag.daten.projekt.titel,
      antragsnummer: antrag.nummer,
      eingangsdatum: datumDe(antrag.eingereichtAm, true),
      betrag: euro,
    };
    setSumme(vorschlag > 0 ? formatBetrag(vorschlag) : "");
    setLetzterBetrag(euro);
    setBetreff(fuelleVorlage(BEWILLIGUNG_VORLAGE.betreff, kontext));
    setText(fuelleVorlage(BEWILLIGUNG_VORLAGE.text, kontext));
    setFehler({});
    setServerFehler("");
    // Nur beim Öffnen vorbelegen – Eingaben bleiben bei Fehlern erhalten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen]);

  /** Betrag geändert: im Text den bisher eingesetzten Betrag mitziehen. */
  function betragUebernehmen() {
    const norm = normalisiereBetrag(summe);
    setSumme(norm);
    const p = parseBetrag(norm);
    if (!p.ok || p.leer || p.n <= 0) return;
    const neu = formatEuro(p.n);
    if (letzterBetrag && neu !== letzterBetrag && text.includes(letzterBetrag)) setText(text.split(letzterBetrag).join(neu));
    setLetzterBetrag(neu);
  }

  async function speichern(mitMail: boolean) {
    const f: Record<string, string> = {};
    const p = parseBetrag(summe);
    if (!p.ok || p.leer || p.n <= 0) f.betrag = "Bitte geben Sie den bewilligten Betrag an, z. B. 4.000,00.";
    if (mitMail) {
      if (!betreff.trim()) f.betreff = "Bitte geben Sie einen Betreff an.";
      const offeneTeile = offenePlatzhalter(text);
      if (!text.trim()) f.text = "Der Text der E-Mail darf nicht leer sein.";
      else if (offeneTeile.length)
        f.text = `Bitte ergänzen Sie die Abschnitte in eckigen Klammern (${offeneTeile.join(", ")}) und entfernen Sie die Klammern.`;
    }
    setFehler(f);
    setServerFehler("");
    if (Object.keys(f).length) {
      document.getElementById(`bewilligung-${Object.keys(f)[0]}`)?.focus();
      return;
    }
    setLaeuft(mitMail ? "mail" : "ohne");
    const r = await sendeBewilligung({ antragId: antrag.id, betrag: p.ok && !p.leer ? p.n : 0, mitMail, betreff, text });
    if (!r.ok) {
      setLaeuft(null);
      setServerFehler(r.fehler);
      requestAnimationFrame(() => document.getElementById("bewilligung-serverfehler")?.focus());
      return;
    }
    const neu = await ladeAntrag(antrag.id).catch(() => null);
    setLaeuft(null);
    if (neu) onGespeichert(neu, mitMail);
    else onSchliessen();
  }

  const offeneTeile = offenePlatzhalter(text);

  return (
    <Dialog offen={offen} onSchliessen={() => !laeuft && onSchliessen()} titel="Antrag bewilligen" beschreibung={`Antrag ${antrag.nummer} · ${antrag.daten.projekt.titel}`} breite="max-w-3xl">
      <div className="grid gap-6">
        <div className="flex flex-col gap-2 max-w-xs">
          <label htmlFor="bewilligung-betrag" className="text-sm font-medium text-neutral-800">
            Bewilligter Betrag <span aria-hidden="true" className="text-fehler">*</span>
          </label>
          <p id="bewilligung-betrag-hinweis" className="text-sm text-neutral-700 -mt-1">
            Beantragt: {formatEuro(betrag(antrag.daten.finanzierung.stiftung))}
          </p>
          <div className="relative">
            <input
              id="bewilligung-betrag"
              inputMode="decimal"
              value={summe}
              onChange={(e) => setSumme(e.target.value)}
              onBlur={betragUebernehmen}
              placeholder="0,00"
              aria-required
              aria-invalid={fehler.betrag ? true : undefined}
              aria-describedby={`bewilligung-betrag-hinweis${fehler.betrag ? " bewilligung-betrag-fehler" : ""}`}
              className="w-full h-12 rounded-pill border border-neutral-700 bg-neutral-100 pl-[18px] pr-10 text-right text-base tabular-nums text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut aria-[invalid=true]:border-fehler aria-[invalid=true]:border-2"
            />
            <span aria-hidden="true" className="absolute right-[18px] top-1/2 -translate-y-1/2 text-neutral-700">€</span>
          </div>
          <Fehlertext id="bewilligung-betrag-fehler" text={fehler.betrag} />
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-800">Empfänger</p>
          <p className="mt-1 text-neutral-800 break-all">{antrag.kontoEmail ?? "Konto-Adresse des Antragstellers"}</p>
          <p className="mt-1 text-sm text-neutral-700">Bestätigte Konto-Adresse des Antragstellers. Eine Blindkopie geht an das Postfach der Stiftung.</p>
        </div>
        <Textfeld id="bewilligung-betreff" label="Betreff" value={betreff} onChange={(e) => setBetreff(e.target.value)} fehler={fehler.betreff} pflicht />
        <Textbereich
          id="bewilligung-text"
          label="Nachricht"
          hinweis="Abschnitte in eckigen Klammern bitte vor dem Versand ergänzen. Keine Bankdaten angeben."
          value={text}
          onChange={(e) => setText(e.target.value)}
          fehler={fehler.text}
          pflicht
          rows={16}
          className="[&_textarea]:min-h-72"
        />
        {offeneTeile.length > 0 && !fehler.text && (
          <Hinweisbox art="warn">Noch zu ergänzen: {offeneTeile.join(", ")}. Ohne E-Mail können Sie trotzdem bewilligen.</Hinweisbox>
        )}
        {serverFehler && (
          <div id="bewilligung-serverfehler" tabIndex={-1} role="alert" className="border-l-4 border-fehler bg-[#b3361a12] px-5 py-4 text-neutral-800 focus:outline-none">
            {serverFehler}
          </div>
        )}
        <p className="text-sm text-neutral-700">
          „Bewilligen und E-Mail senden“ verschickt die Nachricht über das Postfach der Stiftung; erst danach wird der Status auf „Bewilligt“ gesetzt.
          „Nur bewilligen“ setzt Status und Betrag ohne E-Mail.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variante="ghost" onClick={onSchliessen} disabled={!!laeuft}>Abbrechen</Button>
          <Button variante="sekundaer" onClick={() => speichern(false)} disabled={!!laeuft}>
            {laeuft === "ohne" ? "Wird gespeichert …" : "Nur bewilligen, keine E-Mail"}
          </Button>
          <Button onClick={() => speichern(true)} disabled={!!laeuft}>
            {laeuft === "mail" ? "Wird gesendet …" : "Bewilligen und E-Mail senden"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
