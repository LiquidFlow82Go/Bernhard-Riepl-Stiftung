"use client";

import { useMemo, useState } from "react";

/** Gemeinsame Bausteine der Listen „Eingegangene Anträge“ und „Eigene Initiativen“. */

export const SELECT =
  "h-12 w-full rounded-pill border border-neutral-700 bg-neutral-100 px-[18px] pr-10 text-base text-neutral-800 appearance-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%230f0b08%22 stroke-width=%221.3%22/></svg>')] bg-[length:12px] bg-[right_18px_center] bg-no-repeat";

export type Richtung = "auf" | "ab";

/** Sortierung nach Spalten: Wert-Funktion je Schlüssel, Strings deutsch sortiert. */
export function useSortierung<T, K extends string>(
  liste: T[] | null,
  werte: Record<K, (x: T) => string | number | null | undefined>,
  start: { schluessel: NoInfer<K>; richtung: Richtung },
) {
  const [s, setS] = useState(start);
  const sortiert = useMemo(() => {
    if (!liste) return null;
    const f = werte[s.schluessel];
    const faktor = s.richtung === "auf" ? 1 : -1;
    return [...liste].sort((a, b) => {
      const x = f(a), y = f(b);
      if (x == null || x === "") return 1;
      if (y == null || y === "") return -1;
      if (typeof x === "number" && typeof y === "number") return (x - y) * faktor;
      return String(x).localeCompare(String(y), "de", { numeric: true, sensitivity: "base" }) * faktor;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liste, s]);
  function umschalten(k: K) {
    setS((alt) => (alt.schluessel === k ? { schluessel: k, richtung: alt.richtung === "auf" ? "ab" : "auf" } : { schluessel: k, richtung: "auf" }));
  }
  return { sortiert, schluessel: s.schluessel, richtung: s.richtung, umschalten, setze: setS };
}

/** Spaltenkopf mit Sortierknopf (aria-sort am th). */
export function SortKopf<K extends string>({
  k, aktiv, richtung, onSort, children, rechts,
}: {
  k: K;
  aktiv: K;
  richtung: Richtung;
  onSort: (k: K) => void;
  children: React.ReactNode;
  rechts?: boolean;
}) {
  const ist = k === aktiv;
  return (
    <th scope="col" aria-sort={ist ? (richtung === "auf" ? "ascending" : "descending") : "none"} className={rechts ? "!text-right" : ""}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1.5 min-h-11 -my-2 cursor-pointer hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut ${rechts ? "flex-row-reverse" : ""}`}
      >
        {children}
        <svg aria-hidden="true" viewBox="0 0 10 14" className={`w-2.5 shrink-0 ${ist ? "opacity-100" : "opacity-35"}`}>
          <path d="M5 1L1.5 5h7z" fill={ist && richtung === "auf" ? "currentColor" : "none"} stroke="currentColor" />
          <path d="M5 13L1.5 9h7z" fill={ist && richtung === "ab" ? "currentColor" : "none"} stroke="currentColor" />
        </svg>
      </button>
    </th>
  );
}

/** Sortierauswahl für die Kartenansicht auf dem Smartphone. */
export function SortAuswahl<K extends string>({
  id, optionen, schluessel, richtung, onChange,
}: {
  id: string;
  optionen: { k: K; label: string }[];
  schluessel: K;
  richtung: Richtung;
  onChange: (s: { schluessel: K; richtung: Richtung }) => void;
}) {
  return (
    <div className="flex flex-col gap-2 md:hidden">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">Sortieren nach</label>
      <select
        id={id}
        className={SELECT}
        value={`${schluessel}|${richtung}`}
        onChange={(e) => {
          const [k, r] = e.target.value.split("|");
          onChange({ schluessel: k as K, richtung: r as Richtung });
        }}
      >
        {optionen.flatMap((o) => [
          <option key={o.k + "auf"} value={`${o.k}|auf`}>{o.label} – aufsteigend</option>,
          <option key={o.k + "ab"} value={`${o.k}|ab`}>{o.label} – absteigend</option>,
        ])}
      </select>
    </div>
  );
}
