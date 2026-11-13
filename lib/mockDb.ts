/**
 * Beispiel-Datenbank für Phase 1: liegt im localStorage des Browsers.
 * Nur von den Funktionen in lib/ verwendet – Komponenten greifen nie direkt zu.
 * In Phase 2 wird diese Datei durch den Supabase-Client ersetzt.
 */
import { BEISPIEL_ANTRAEGE, BEISPIEL_BENUTZER } from "./beispieldaten";
import type { Antrag, Benutzer } from "./types";

const KEY = "brs-beispiel-db-v1";

interface Db {
  benutzer: Benutzer[];
  antraege: Antrag[];
}

let cache: Db | null = null;

function seed(): Db {
  return {
    benutzer: structuredClone(BEISPIEL_BENUTZER),
    antraege: structuredClone(BEISPIEL_ANTRAEGE),
  };
}

export function db(): Db {
  if (cache) return cache;
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Db) : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

export function speichern(): void {
  if (!cache || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* Speicher voll oder gesperrt: Daten bleiben bis zum Neuladen im Speicher */
  }
}

/** Setzt die Beispieldaten zurück (Schalter in der Testanmeldung). */
export function zuruecksetzen(): void {
  cache = seed();
  speichern();
}

/** Simulierte Netzwerkverzögerung, damit Ladezustände sichtbar sind. */
export const warte = (ms = 150) => new Promise((r) => setTimeout(r, ms));
