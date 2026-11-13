"use client";

import { useId, useRef, useState } from "react";
import { ERLAUBTE_ENDUNGEN, formatGroesse, pruefeDatei } from "@/lib/dokumente";
import { DOKUMENT_LABEL, type DokumentKategorie } from "@/lib/types";
import { useAntrag } from "./AntragKontext";

const KATEGORIEN: { k: DokumentKategorie; hinweis: string }[] = [
  { k: "freistellung", hinweis: "Für alle Antragsteller erforderlich." },
  { k: "satzung", hinweis: "Bei Vereinen erforderlich." },
  { k: "vereinsregister", hinweis: "Bei Vereinen erforderlich, möglichst aktuell." },
  { k: "gemeinnuetzigkeit", hinweis: "Bei Vereinen erforderlich." },
  { k: "weitere", hinweis: "Zum Beispiel Kostenvoranschläge, Projektskizzen oder Zusagen anderer Förderer." },
];

function UploadFeld({ k, hinweis }: { k: DokumentKategorie; hinweis: string }) {
  const { dateien, setDateien } = useAntrag();
  const liste = dateien[k];
  const [meldung, setMeldung] = useState<{ art: "ok" | "fehler"; text: string } | null>(null);
  const [ziehen, setZiehen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function hinzu(files: FileList | null) {
    if (!files?.length) return;
    const neu: File[] = [];
    const fehler: string[] = [];
    for (const f of Array.from(files)) {
      const p = pruefeDatei(f);
      if (p) fehler.push(p);
      else if (!liste.some((x) => x.name === f.name && x.size === f.size)) neu.push(f);
    }
    if (neu.length) setDateien(k, [...liste, ...neu]);
    setMeldung(
      fehler.length
        ? { art: "fehler", text: fehler.join(" ") }
        : { art: "ok", text: `${neu.length === 1 ? `„${neu[0].name}“ wurde` : `${neu.length} Dateien wurden`} hinzugefügt.` },
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  function entferne(i: number) {
    const f = liste[i];
    setDateien(k, liste.filter((_, j) => j !== i));
    setMeldung({ art: "ok", text: `„${f.name}“ wurde entfernt.` });
  }

  return (
    <fieldset className="border-b border-neutral-400 py-6 min-w-0">
      <legend className="sr-only">{DOKUMENT_LABEL[k]}</legend>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <p aria-hidden="true" className="text-lg text-neutral-800 font-display font-normal">{DOKUMENT_LABEL[k]}</p>
          <p id={`${id}-h`} className="text-sm text-neutral-700 mt-1">{hinweis}</p>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setZiehen(true); }}
          onDragLeave={() => setZiehen(false)}
          onDrop={(e) => { e.preventDefault(); setZiehen(false); hinzu(e.dataTransfer.files); }}
          className={`rounded-pill ${ziehen ? "outline-2 outline-dashed outline-eisenhut outline-offset-4" : ""}`}
        >
          <input
            ref={inputRef}
            id={id}
            type="file"
            multiple
            accept={ERLAUBTE_ENDUNGEN}
            className="peer sr-only"
            aria-describedby={`${id}-h ${id}-f`}
            onChange={(e) => hinzu(e.target.files)}
          />
          <label
            htmlFor={id}
            className="inline-flex items-center justify-center gap-2 rounded-pill border border-neutral-400 bg-neutral-100 shadow-button px-5 py-[11px] font-display text-[15px] text-neutral-800 cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-eisenhut max-[479px]:w-full"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4"><path d="M8 11V2M4.5 5.5 8 2l3.5 3.5M2 11v3h12v-3" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            Datei auswählen<span className="sr-only">: {DOKUMENT_LABEL[k]}</span>
          </label>
        </div>
      </div>

      {liste.length > 0 && (
        <ul className="mt-4 grid gap-2" aria-label={`Ausgewählte Dateien: ${DOKUMENT_LABEL[k]}`}>
          {liste.map((f, i) => (
            <li key={f.name + i} className="flex items-center justify-between gap-4 bg-neutral-100 border border-neutral-400 px-4 py-2.5">
              <span className="min-w-0 truncate text-neutral-800">
                {f.name} <span className="text-neutral-700 text-sm">· {formatGroesse(f.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => entferne(i)}
                className="shrink-0 text-sm underline underline-offset-4 text-neutral-800 cursor-pointer py-1"
              >
                Entfernen<span className="sr-only">: {f.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p id={`${id}-f`} role="status" className={`text-sm mt-2 min-h-5 ${meldung?.art === "fehler" ? "text-fehler" : "text-neutral-700"}`}>
        {meldung?.text}
      </p>
    </fieldset>
  );
}

export function DokumenteUpload() {
  return (
    <div>
      <p className="text-base max-w-[70ch]">
        Erlaubt sind PDF, JPG und PNG mit höchstens 10 MB je Datei. Sie können pro Anlage mehrere Dateien auswählen oder per
        Drag-and-drop ablegen.
      </p>
      <p className="mt-3 text-sm text-neutral-700 max-w-[70ch]">
        Hinweis für die Testphase: Die Dateien bleiben nur in diesem Browserfenster und werden noch nicht gespeichert.
      </p>
      <div className="mt-6 border-t border-neutral-400">
        {KATEGORIEN.map((x) => (
          <UploadFeld key={x.k} k={x.k} hinweis={x.hinweis} />
        ))}
      </div>
    </div>
  );
}
