"use client";

import { useId, useRef, useState } from "react";
import { ERLAUBTE_ENDUNGEN, formatGroesse } from "@/lib/dokumente";
import { entferneInitiativDatei, ladeInitiativDateiHoch } from "@/lib/initiativen";
import { INITIATIV_DOK_LABEL, nachweisArtLabel, type InitiativDokKategorie, type Initiative } from "@/lib/initiativeTypen";
import { SELECT } from "../stiftungsvorstand/Liste";
import { DokumentAktion } from "./InitiativAnsicht";

/**
 * Datei-Upload zu einer Initiative. Dateien werden sofort gespeichert
 * (gleiche Regeln wie beim Antrag: PDF, JPG, PNG, max. 10 MB).
 * Vor dem ersten Speichern gibt es noch kein Aktenzeichen und damit keinen Ablageort.
 */
export function InitiativUpload({
  initiative, kategorie, hinweis, onGeaendert, onErstSpeichern, arten, feldId, fehler, titel,
}: {
  initiative: Initiative | null;
  kategorie: InitiativDokKategorie;
  hinweis?: string;
  onGeaendert: () => Promise<void>;
  onErstSpeichern: () => void;
  /** Auswahl der Nachweisart vor dem Hochladen (z. B. bei Bedürftigkeit) */
  arten?: readonly { id: string; label: string }[];
  /** ID für Sprungziele aus der Fehlerübersicht */
  feldId?: string;
  fehler?: string;
  titel?: string;
}) {
  const id = useId();
  const [art, setArt] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [meldung, setMeldung] = useState<{ art: "ok" | "fehler"; text: string } | null>(null);
  const [laedt, setLaedt] = useState(false);
  const label = titel ?? INITIATIV_DOK_LABEL[kategorie];
  const liste = (initiative?.dokumente ?? []).filter((d) => d.kategorie === kategorie);
  const entwurf = initiative?.status === "entwurf";
  const gesperrt = initiative?.status === "abgeschlossen";

  async function hoch(files: FileList | null) {
    if (!files?.length || !initiative) return;
    if (arten && !art) {
      setMeldung({ art: "fehler", text: "Bitte wählen Sie zuerst die Art des Nachweises." });
      if (input.current) input.current.value = "";
      document.getElementById(`${id}-art`)?.focus();
      return;
    }
    setLaedt(true);
    setMeldung(null);
    const fehler: string[] = [];
    let ok = 0;
    for (const f of Array.from(files)) {
      try {
        await ladeInitiativDateiHoch(initiative, kategorie, f, arten ? art : undefined);
        ok++;
      } catch (e) {
        fehler.push((e as Error).message);
      }
    }
    await onGeaendert();
    setLaedt(false);
    if (input.current) input.current.value = "";
    setMeldung(
      fehler.length
        ? { art: "fehler", text: `${ok ? `${ok} Datei(en) gespeichert. ` : ""}${fehler.join(" ")}` }
        : { art: "ok", text: ok === 1 ? "Die Datei wurde gespeichert." : `${ok} Dateien wurden gespeichert.` },
    );
  }

  async function entfernen(i: number) {
    const d = liste[i];
    setMeldung(null);
    try {
      await entferneInitiativDatei(d);
      await onGeaendert();
      setMeldung({ art: "ok", text: `„${d.dateiname}“ wurde entfernt.` });
    } catch (e) {
      setMeldung({ art: "fehler", text: (e as Error).message });
    }
  }

  return (
    <fieldset
      id={feldId}
      tabIndex={feldId ? -1 : undefined}
      aria-describedby={fehler ? `${id}-pflicht` : undefined}
      className={`min-w-0 rounded-[22px] border bg-neutral-100/80 p-5 focus:outline-2 focus:outline-eisenhut ${fehler ? "border-fehler border-2" : "border-[#e4c9a5]"}`}
    >
      <legend className="px-2 -ml-2 text-base font-medium text-neutral-800">{label}</legend>
      {hinweis && <p id={`${id}-h`} className="text-sm text-neutral-700">{hinweis}</p>}
      {fehler && <p id={`${id}-pflicht`} className="mt-1 text-sm text-fehler">! {fehler}</p>}
      {!initiative ? (
        <p className="mt-2 text-sm text-neutral-800">
          Dateien lassen sich hochladen, sobald die Initiative ein Aktenzeichen hat.{" "}
          <button type="button" onClick={onErstSpeichern} className="underline underline-offset-4 cursor-pointer min-h-11">
            Jetzt als Entwurf speichern
          </button>
        </p>
      ) : (
        <>
          {liste.length > 0 && (
            <ul className="mt-3 grid gap-2" aria-label={`Gespeicherte Dateien: ${label}`}>
              {liste.map((d, i) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-neutral-100 border border-neutral-400 px-4 py-2">
                  <span className="min-w-0 break-all text-neutral-800">
                    {d.dateiname} <span className="text-sm text-neutral-700">· {formatGroesse(d.groesse)}</span>
                    {d.nachweisArt && <span className="block text-sm text-neutral-700">{nachweisArtLabel(d.nachweisArt)}</span>}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-4">
                    <DokumentAktion d={d} />
                    {entwurf && (
                      <button type="button" onClick={() => entfernen(i)} className="text-sm underline underline-offset-4 text-neutral-800 cursor-pointer min-h-11 px-1">
                        Entfernen<span className="sr-only">: {d.dateiname}</span>
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!gesperrt && (
            <div className="mt-3">
              {arten && (
                <div className="mb-3 flex flex-col gap-2 max-w-md">
                  <label htmlFor={`${id}-art`} className="text-sm font-medium text-neutral-800">Art des Nachweises</label>
                  <select id={`${id}-art`} value={art} onChange={(e) => setArt(e.target.value)} className={SELECT}>
                    <option value="">Bitte wählen …</option>
                    {arten.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
              )}
              <input
                ref={input}
                id={id}
                type="file"
                multiple
                accept={ERLAUBTE_ENDUNGEN}
                className="peer sr-only"
                aria-describedby={`${hinweis ? `${id}-h ` : ""}${id}-m`}
                onChange={(e) => hoch(e.target.files)}
                disabled={laedt}
              />
              <label
                htmlFor={id}
                className="inline-flex items-center justify-center gap-2 min-h-12 rounded-pill border border-neutral-400 bg-neutral-100 shadow-button px-5 py-[11px] font-display text-[15px] text-neutral-800 cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-eisenhut max-[479px]:w-full"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4"><path d="M8 11V2M4.5 5.5 8 2l3.5 3.5M2 11v3h12v-3" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                {laedt ? "Wird hochgeladen …" : "Datei auswählen oder fotografieren"}
                <span className="sr-only">: {label}</span>
              </label>
              <p className="mt-2 text-xs text-neutral-700">PDF, JPG oder PNG, höchstens 10 MB je Datei.{!entwurf && " Nach dem Beschluss können Dateien nur noch ergänzt, nicht entfernt werden."}</p>
            </div>
          )}
          <p id={`${id}-m`} role="status" className={`mt-2 text-sm empty:hidden ${meldung?.art === "fehler" ? "text-fehler" : "text-neutral-700"}`}>
            {meldung?.text}
          </p>
        </>
      )}
    </fieldset>
  );
}
