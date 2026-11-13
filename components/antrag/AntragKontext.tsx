"use client";

import { createContext, useContext } from "react";
import { feldId, istPflicht, wertAnPfad, type Fehler } from "@/lib/antragSchema";
import type { AntragDaten, DokumentKategorie } from "@/lib/types";

export interface AntragKontextWert {
  daten: AntragDaten;
  setze: (pfad: string, wert: unknown) => void;
  fehler: Fehler;
  dateien: Record<DokumentKategorie, File[]>;
  setDateien: (k: DokumentKategorie, f: File[]) => void;
  geheZu: (schritt: number, fokusPfad?: string) => void;
}

export const AntragKontext = createContext<AntragKontextWert | null>(null);

export function useAntrag() {
  const c = useContext(AntragKontext);
  if (!c) throw new Error("useAntrag außerhalb des Formulars");
  return c;
}

/** Bindet ein Textfeld an einen Pfad im Antrag. */
export function useFeld(pfad: string) {
  const { daten, setze, fehler } = useAntrag();
  return {
    id: feldId(pfad),
    name: pfad,
    value: String(wertAnPfad(daten, pfad) ?? ""),
    onChange: (e: { target: { value: string } }) => setze(pfad, e.target.value),
    fehler: fehler[pfad],
    pflicht: istPflicht(pfad),
  };
}

/** Setzt einen Wert an einem Punkt-Pfad (unveränderlich). */
export function setzeAnPfad<T>(obj: T, pfad: string, wert: unknown): T {
  const teile = pfad.split(".");
  const kopie = structuredClone(obj) as Record<string, unknown>;
  let o = kopie;
  for (let i = 0; i < teile.length - 1; i++) o = o[teile[i]] as Record<string, unknown>;
  o[teile[teile.length - 1]] = wert;
  return kopie as T;
}
