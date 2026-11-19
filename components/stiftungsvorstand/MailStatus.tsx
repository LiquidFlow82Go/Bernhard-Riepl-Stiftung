"use client";

import { useCallback, useEffect, useState } from "react";
import { ladeMailProtokoll } from "@/lib/antraege";
import { benachrichtigungErneutSenden } from "@/lib/email";
import { MAIL_ART_LABEL, type MailProtokollEintrag } from "@/lib/types";
import { Button } from "../ui/Button";
import { Hinweisbox } from "../ui/Diverses";

function zeit(iso: string) {
  return new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

/** E-Mail-Protokoll eines Antrags mit Möglichkeit, die Vorstands-Benachrichtigung erneut zu senden. */
export function MailStatus({ antragId, aktualisierung }: { antragId: string; aktualisierung: number }) {
  const [eintraege, setEintraege] = useState<MailProtokollEintrag[] | null>(null);
  const [sendet, setSendet] = useState(false);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);

  const lade = useCallback(() => {
    ladeMailProtokoll(antragId).then(setEintraege).catch(() => setEintraege([]));
  }, [antragId]);

  useEffect(lade, [lade, aktualisierung]);

  if (!eintraege) return null;

  const rat = eintraege.filter((e) => e.art === "eingang_stiftungsrat");
  const ratOk = rat.some((e) => e.erfolgreich);
  const ratFehlgeschlagen = !ratOk && rat.length > 0;

  async function erneut() {
    setSendet(true);
    setMeldung(null);
    const r = await benachrichtigungErneutSenden(antragId);
    setSendet(false);
    setMeldung(r.ok ? { ok: true, text: "Die Benachrichtigung wurde gesendet." } : { ok: false, text: r.fehler ?? "Fehler beim Senden." });
    lade();
  }

  return (
    <section aria-labelledby="mail-titel">
      <h2 id="mail-titel" className="text-2xl leading-snug">E-Mails</h2>

      {ratFehlgeschlagen && (
        <div className="mt-4">
          <Hinweisbox art="warn">
            Die Benachrichtigung an den Stiftungsvorstand zu diesem Antrag konnte nicht versendet werden.
          </Hinweisbox>
        </div>
      )}
      {(ratFehlgeschlagen || rat.length === 0) && (
        <div className="mt-4">
          <Button variante="sekundaer" onClick={erneut} disabled={sendet}>
            {sendet ? "Wird gesendet …" : "Benachrichtigung erneut senden"}
          </Button>
        </div>
      )}
      <p role="status" className={`mt-2 text-sm min-h-5 ${meldung && !meldung.ok ? "text-fehler" : "text-neutral-800"}`}>
        {meldung?.text}
      </p>

      {eintraege.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-700">Zu diesem Antrag wurden noch keine E-Mails versendet.</p>
      ) : (
        <ul className="mt-2 border-t border-neutral-400">
          {eintraege.map((e, i) => (
            <li key={i} className="py-3 border-b border-neutral-400 text-sm">
              <span className="flex items-center justify-between gap-3">
                <span className="text-neutral-800 font-medium">{MAIL_ART_LABEL[e.art]}</span>
                <span className={e.erfolgreich ? "text-wiese" : "text-fehler"}>{e.erfolgreich ? "gesendet" : "fehlgeschlagen"}</span>
              </span>
              <span className="block text-neutral-700">{zeit(e.zeitpunkt)} · an {e.empfaenger || "–"}</span>
              {e.fehler && <span className="block text-fehler">{e.fehler}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
