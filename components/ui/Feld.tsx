"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";

const FELD =
  "w-full min-w-0 bg-neutral-100 text-neutral-800 border border-neutral-700 font-body text-base leading-6 " +
  "placeholder:text-neutral-600 transition-colors duration-300 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut " +
  "aria-[invalid=true]:border-fehler aria-[invalid=true]:border-2 read-only:bg-neutral-200";

export const eingabeKlassen = `${FELD} h-12 rounded-pill px-[18px]`;
export const textKlassen = `${FELD} rounded-[22px] px-[18px] py-3 resize-y min-h-28`;

interface Basis {
  id: string;
  label: string;
  hinweis?: ReactNode;
  fehler?: string;
  pflicht?: boolean;
  className?: string;
}

function Kopf({ id, label, pflicht }: { id: string; label: string; pflicht?: boolean }) {
  return (
    <label htmlFor={id} className="feld-label block pb-2 text-sm leading-5 text-neutral-800 font-medium">
      {label}
      {pflicht && (
        <>
          <span aria-hidden="true" className="text-fehler"> *</span>
          <span className="sr-only"> (Pflichtfeld)</span>
        </>
      )}
    </label>
  );
}

export function Fehlertext({ id, text, className = "" }: { id: string; text?: string; className?: string }) {
  if (!text) return null;
  return (
    <p id={id} className={`text-sm leading-5 text-fehler flex gap-1.5 items-start ${className}`}>
      <span aria-hidden="true">!</span>
      {text}
    </p>
  );
}

function beschrieben(id: string, hinweis?: ReactNode, fehler?: string) {
  return [hinweis ? `${id}-hinweis` : "", fehler ? `${id}-fehler` : ""].filter(Boolean).join(" ") || undefined;
}

export function Textfeld({
  id, label, hinweis, fehler, pflicht, className = "", ...rest
}: Basis & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  return (
    <div className={`feld min-w-0 ${className}`}>
      <Kopf id={id} label={label} pflicht={pflicht} />
      {hinweis && <p id={`${id}-hinweis`} className="feld-hinweis pb-2 -mt-1 text-sm leading-5 text-neutral-700">{hinweis}</p>}
      <input
        id={id}
        className={`feld-eingabe ${eingabeKlassen}`}
        aria-invalid={fehler ? true : undefined}
        aria-required={pflicht || undefined}
        aria-describedby={beschrieben(id, hinweis, fehler)}
        {...rest}
      />
      <Fehlertext id={`${id}-fehler`} text={fehler} className="feld-fehler pt-2" />
    </div>
  );
}

/**
 * Passwortfeld mit Schalter „Passwort anzeigen“ / „Passwort verbergen“.
 * Beim Absenden des Formulars wird das Passwort automatisch wieder verborgen.
 */
export function PasswortFeld({
  id, label, hinweis, fehler, pflicht, className = "", ...rest
}: Basis & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type">) {
  const [sichtbar, setSichtbar] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const verbergen = () => setSichtbar(false);
    form.addEventListener("submit", verbergen, true);
    return () => form.removeEventListener("submit", verbergen, true);
  }, []);
  return (
    <div className={`feld min-w-0 ${className}`}>
      <Kopf id={id} label={label} pflicht={pflicht} />
      {hinweis && <p id={`${id}-hinweis`} className="feld-hinweis pb-2 -mt-1 text-sm leading-5 text-neutral-700">{hinweis}</p>}
      <div className="feld-eingabe relative">
        <input
          ref={ref}
          id={id}
          type={sichtbar ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`${eingabeKlassen} pr-14`}
          aria-invalid={fehler ? true : undefined}
          aria-required={pflicht || undefined}
          aria-describedby={beschrieben(id, hinweis, fehler)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setSichtbar((s) => !s)}
          aria-label={sichtbar ? "Passwort verbergen" : "Passwort anzeigen"}
          aria-pressed={sichtbar}
          aria-controls={id}
          className="absolute right-1 top-1/2 -translate-y-1/2 size-11 inline-flex items-center justify-center rounded-full text-neutral-800 cursor-pointer hover:bg-neutral-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-eisenhut"
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {sichtbar && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>
      <Fehlertext id={`${id}-fehler`} text={fehler} className="feld-fehler pt-2" />
    </div>
  );
}

export function Textbereich({
  id, label, hinweis, fehler, pflicht, className = "", value, ...rest
}: Basis & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <div className={`feld min-w-0 ${className}`}>
      <Kopf id={id} label={label} pflicht={pflicht} />
      {hinweis && <p id={`${id}-hinweis`} className="feld-hinweis pb-2 -mt-1 text-sm leading-5 text-neutral-700">{hinweis}</p>}
      <textarea
        ref={ref}
        id={id}
        value={value}
        className={`feld-eingabe ${textKlassen}`}
        aria-invalid={fehler ? true : undefined}
        aria-required={pflicht || undefined}
        aria-describedby={beschrieben(id, hinweis, fehler)}
        {...rest}
      />
      <Fehlertext id={`${id}-fehler`} text={fehler} className="feld-fehler pt-2" />
    </div>
  );
}

export function JaNeinGruppe({
  name, legende, wert, onChange, hinweis,
}: {
  name: string;
  legende: string;
  wert: string;
  onChange: (v: "Ja" | "Nein") => void;
  hinweis?: string;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm leading-5 text-neutral-800 font-medium">{legende}</legend>
      {hinweis && <p className="text-sm text-neutral-700 mt-1">{hinweis}</p>}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
        {(["Ja", "Nein"] as const).map((v) => (
          <label key={v} className="inline-flex items-center gap-2.5 cursor-pointer min-h-11 pr-2">
            <input
              type="radio"
              name={name}
              value={v}
              checked={wert === v}
              onChange={() => onChange(v)}
              className="size-5 accent-neutral-800"
            />
            {v}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Checkbox({
  id, checked, onChange, children, fehler, pflicht,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  fehler?: string;
  pflicht?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={fehler ? true : undefined}
          aria-required={pflicht || undefined}
          aria-describedby={fehler ? `${id}-fehler` : undefined}
          className="mt-0.5 size-6 shrink-0 accent-neutral-800 cursor-pointer"
        />
        <label htmlFor={id} className="cursor-pointer text-neutral-800">
          {children}
          {pflicht && (
            <>
              <span aria-hidden="true" className="text-fehler"> *</span>
              <span className="sr-only"> (Pflichtfeld)</span>
            </>
          )}
        </label>
      </div>
      <Fehlertext id={`${id}-fehler`} text={fehler} />
    </div>
  );
}

/**
 * Mehrere Felder nebeneinander: Eingaben stehen immer auf gleicher Höhe –
 * auch wenn ein Feld einen Hinweis, eine längere Beschriftung oder eine
 * Fehlermeldung hat (CSS-Grid mit subgrid, siehe globals.css „.feldreihe“).
 * Auf schmalen Bildschirmen stehen die Felder untereinander.
 */
export function FeldReihe({ ab = "sm", className = "", children }: { ab?: "sm" | "md"; className?: string; children: ReactNode }) {
  return <div className={`feldreihe feldreihe-${ab} ${className}`}>{children}</div>;
}
