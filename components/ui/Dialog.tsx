"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modaler Dialog auf Basis von <dialog>.showModal(): Fokusfalle, Esc zum
 * Schließen und inertes Umfeld liefert der Browser. Fokus kehrt zum Auslöser zurück.
 */
export function Dialog({
  offen, onSchliessen, titel, beschreibung, children, breite = "max-w-2xl",
}: {
  offen: boolean;
  onSchliessen: () => void;
  titel: string;
  beschreibung?: string;
  children: ReactNode;
  breite?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const ausloeser = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) {
      ausloeser.current = document.activeElement as HTMLElement;
      d.showModal();
    } else if (!offen && d.open) {
      d.close();
      ausloeser.current?.focus();
    }
  }, [offen]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-titel"
      aria-describedby={beschreibung ? "dialog-beschreibung" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onSchliessen();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onSchliessen();
      }}
      className={`m-auto w-[calc(100%-32px)] ${breite} max-h-[calc(100dvh-32px)] p-0 bg-neutral-200 text-neutral-700 shadow-card backdrop:bg-neutral-800/50`}
    >
      <div className="p-6 md:p-10">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h2 id="dialog-titel" className="text-3xl leading-tight">{titel}</h2>
            {beschreibung && <p id="dialog-beschreibung" className="mt-2 text-base">{beschreibung}</p>}
          </div>
          <button
            type="button"
            onClick={onSchliessen}
            className="shrink-0 size-11 grid place-items-center rounded-pill border border-neutral-400 bg-neutral-100 text-neutral-800 cursor-pointer"
            aria-label="Dialog schließen"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.3" /></svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
