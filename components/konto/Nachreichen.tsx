"use client";

import { useId, useRef, useState } from "react";
import { ladeAntrag, reicheUnterlagenNach } from "@/lib/antraege";
import { ERLAUBTE_ENDUNGEN, formatGroesse, pruefeDatei } from "@/lib/dokumente";
import { meldeNachreichung } from "@/lib/email";
import { DOKUMENT_LABEL, type Antrag, type DokumentKategorie } from "@/lib/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Hinweisbox } from "../ui/Diverses";

const SELECT =
  "h-12 w-full rounded-pill border border-neutral-700 bg-neutral-100 px-[18px] pr-10 text-base text-neutral-800 appearance-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%230f0b08%22 stroke-width=%221.3%22/></svg>')] bg-[length:12px] bg-[right_18px_center] bg-no-repeat";

/**
 * „Unterlagen nachreichen“ in der Detailansicht des Antragstellers.
 * Gleiche Regeln wie beim Antrag (PDF/JPG/PNG, max. 10 MB je Datei).
 * Nur Hinzufügen – kein Löschen oder Ersetzen vorhandener Dokumente.
 */
export function Nachreichen({ antrag, onAktualisiert }: { antrag: Antrag; onAktualisiert: (a: Antrag) => void }) {
  const [offen, setOffen] = useState(false);
  const [kategorie, setKategorie] = useState<DokumentKategorie>("weitere");
  const [dateien, setDateien] = useState<File[]>([]);
  const [meldung, setMeldung] = useState<string>("");
  const [fehler, setFehler] = useState<string>("");
  const [laedt, setLaedt] = useState(false);
  const [ergebnis, setErgebnis] = useState<{ art: "ok" | "fehler" | "info"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function hinzu(files: FileList | null) {
    if (!files?.length) return;
    const neu: File[] = [];
    const f: string[] = [];
    for (const d of Array.from(files)) {
      const p = pruefeDatei(d);
      if (p) f.push(p);
      else if (!dateien.some((x) => x.name === d.name && x.size === d.size)) neu.push(d);
    }
    setDateien([...dateien, ...neu]);
    setFehler(f.join(" "));
    setMeldung(neu.length ? `${neu.length === 1 ? `„${neu[0].name}“ wurde` : `${neu.length} Dateien wurden`} hinzugefügt.` : "");
    if (inputRef.current) inputRef.current.value = "";
  }

  function schliessen() {
    if (laedt) return;
    setOffen(false);
    setDateien([]);
    setFehler("");
    setMeldung("");
  }

  async function hochladen() {
    if (dateien.length === 0) {
      setFehler("Bitte wählen Sie mindestens eine Datei aus.");
      return;
    }
    setLaedt(true);
    setFehler("");
    const r = await reicheUnterlagenNach(
      antrag.id,
      dateien.map((datei) => ({ kategorie, datei })),
    ).catch(() => ({ hochgeladen: 0, fehlgeschlagen: dateien.map((d) => d.name) }));
    if (r.hochgeladen === 0) {
      setLaedt(false);
      setFehler("Die Dateien konnten nicht hochgeladen werden. Bitte versuchen Sie es erneut.");
      return;
    }
    const mail = await meldeNachreichung(antrag.id);
    const neu = await ladeAntrag(antrag.id).catch(() => null);
    if (neu) onAktualisiert(neu);
    setLaedt(false);
    setOffen(false);
    setDateien([]);
    const teile = [
      `${r.hochgeladen === 1 ? "Eine Datei wurde" : `${r.hochgeladen} Dateien wurden`} nachgereicht.`,
      r.fehlgeschlagen.length ? `Nicht übertragen: ${r.fehlgeschlagen.join(", ")}.` : "",
      mail.status === "gesendet" || mail.status === "gesperrt"
        ? "Der Stiftungsrat wurde informiert."
        : "Der Stiftungsrat sieht die neuen Unterlagen bei der nächsten Durchsicht.",
    ];
    setErgebnis({ art: r.fehlgeschlagen.length ? "info" : "ok", text: teile.filter(Boolean).join(" ") });
  }

  return (
    <section aria-labelledby="nachreichen-titel" className="mt-10 border-y border-neutral-400 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h2 id="nachreichen-titel" className="text-2xl leading-snug">Unterlagen nachreichen</h2>
          <p className="mt-1 text-sm text-neutral-700">
            Solange Ihr Antrag geprüft wird, können Sie fehlende Dokumente ergänzen. Bereits hochgeladene Dokumente bleiben unverändert.
          </p>
        </div>
        <Button variante="sekundaer" onClick={() => { setErgebnis(null); setOffen(true); }} aria-haspopup="dialog">
          Unterlagen nachreichen
        </Button>
      </div>
      <div role="status" className="empty:hidden mt-4">
        {ergebnis && <Hinweisbox art={ergebnis.art}>{ergebnis.text}</Hinweisbox>}
      </div>

      <Dialog
        offen={offen}
        onSchliessen={schliessen}
        titel="Unterlagen nachreichen"
        beschreibung={`Antrag ${antrag.nummer} · PDF, JPG oder PNG, höchstens 10 MB je Datei.`}
      >
        <div className="grid gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-art`} className="text-sm font-medium text-neutral-800">Art der Unterlage</label>
            <select id={`${id}-art`} value={kategorie} onChange={(e) => setKategorie(e.target.value as DokumentKategorie)} className={SELECT}>
              {(Object.keys(DOKUMENT_LABEL) as DokumentKategorie[]).map((k) => (
                <option key={k} value={k}>{DOKUMENT_LABEL[k]}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              ref={inputRef}
              id={`${id}-datei`}
              type="file"
              multiple
              accept={ERLAUBTE_ENDUNGEN}
              className="peer sr-only"
              aria-describedby={`${id}-fehler ${id}-meldung`}
              onChange={(e) => hinzu(e.target.files)}
            />
            <label
              htmlFor={`${id}-datei`}
              className="inline-flex items-center justify-center gap-2 min-h-12 rounded-pill border border-neutral-400 bg-neutral-100 shadow-button px-5 py-[11px] font-display text-[15px] text-neutral-800 cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-eisenhut max-[479px]:w-full"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4"><path d="M8 11V2M4.5 5.5 8 2l3.5 3.5M2 11v3h12v-3" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
              Dateien auswählen oder fotografieren
            </label>
          </div>

          {dateien.length > 0 && (
            <ul className="grid gap-2" aria-label="Ausgewählte Dateien">
              {dateien.map((f, i) => (
                <li key={f.name + i} className="flex items-center justify-between gap-4 bg-neutral-100 border border-neutral-400 px-4 py-2">
                  <span className="min-w-0 truncate text-neutral-800">
                    {f.name} <span className="text-neutral-700 text-sm">· {formatGroesse(f.size)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDateien(dateien.filter((_, j) => j !== i))}
                    disabled={laedt}
                    className="shrink-0 text-sm underline underline-offset-4 text-neutral-800 cursor-pointer min-h-11 px-1"
                  >
                    Entfernen<span className="sr-only">: {f.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p id={`${id}-meldung`} role="status" className="text-sm text-neutral-700 empty:hidden">{meldung}</p>
          <p id={`${id}-fehler`} role="alert" className="text-sm text-fehler empty:hidden">{fehler}</p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={hochladen} disabled={laedt}>
              {laedt ? "Wird hochgeladen …" : "Hochladen"}
            </Button>
            <Button variante="ghost" onClick={schliessen} disabled={laedt}>Abbrechen</Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
