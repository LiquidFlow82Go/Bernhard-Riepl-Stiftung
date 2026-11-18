"use client";

import { normalisiereBetrag } from "@/lib/betrag";
import { Fehlertext } from "../ui/Feld";
import { useAntrag, useFeld } from "./AntragKontext";

/** Betragszeile wie in der Vorlage: Label links, Betrag rechtsbündig. */
export function BetragZeile({
  pfad, label, hinweis, eingerueckt,
}: {
  pfad: string;
  label: string;
  hinweis?: string;
  eingerueckt?: boolean;
}) {
  const f = useFeld(pfad);
  const { setze } = useAntrag();
  const beschr = [hinweis ? `${f.id}-hinweis` : "", f.fehler ? `${f.id}-fehler` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="border-b border-neutral-400 py-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(8.5rem,11rem)] gap-2 sm:gap-3 sm:items-center">
        <label htmlFor={f.id} className={`text-base text-neutral-800 ${eingerueckt ? "sm:pl-5" : ""}`}>
          {label}
          {f.pflicht && (
            <>
              <span aria-hidden="true" className="text-fehler"> *</span>
              <span className="sr-only"> (Pflichtfeld)</span>
            </>
          )}
          {hinweis && (
            <span id={`${f.id}-hinweis`} className="block text-sm text-neutral-700">
              {hinweis}
            </span>
          )}
        </label>
        <div className="relative">
          <input
            id={f.id}
            name={f.name}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={f.value}
            onChange={f.onChange}
            onBlur={() => setze(pfad, normalisiereBetrag(f.value))}
            aria-invalid={f.fehler ? true : undefined}
            aria-required={f.pflicht || undefined}
            aria-describedby={beschr}
            className="w-full h-12 sm:h-11 text-base rounded-pill border border-neutral-700 bg-neutral-100 pl-4 pr-9 text-right tabular-nums text-neutral-800 placeholder:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut aria-[invalid=true]:border-fehler aria-[invalid=true]:border-2"
          />
          <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700">€</span>
        </div>
      </div>
      {f.fehler && (
        <div className="mt-2">
          <Fehlertext id={`${f.id}-fehler`} text={f.fehler} />
        </div>
      )}
    </div>
  );
}

export function SummenZeile({ label, wert, hinweis, gesamt }: { label: string; wert: string; hinweis?: string; gesamt?: boolean }) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(8.5rem,11rem)] gap-3 items-center py-3 ${gesamt ? "border-t-2 border-neutral-800 mt-1" : "border-b border-neutral-400"}`}
    >
      <span className={`text-neutral-800 ${gesamt ? "text-lg font-medium" : "font-medium"}`}>
        {label}
        {hinweis && <span className="block text-sm font-normal text-neutral-700">{hinweis}</span>}
      </span>
      <span className={`text-right tabular-nums sm:pr-9 whitespace-nowrap text-neutral-800 ${gesamt ? "text-lg font-medium" : "font-medium"}`}>{wert} €</span>
    </div>
  );
}

export function Gruppe({ children }: { children: React.ReactNode }) {
  return <div className="pt-4 pb-1 border-b border-neutral-400 font-medium text-neutral-800">{children}</div>;
}
