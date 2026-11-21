/**
 * Dokumente zu Anträgen. Die Dateien liegen im privaten Supabase-Bucket
 * „antragsdokumente“; Ansehen und Herunterladen laden die Datei
 * angemeldet und öffnen sie lokal (siehe zeigeDatei). Wer was sehen darf, regeln die Storage-Policies.
 */
import { DOKUMENTE_BUCKET } from "./supabase/env";
import { supabase } from "./supabase/client";
import type { Dokument } from "./types";

export const ERLAUBTE_TYPEN = ["application/pdf", "image/jpeg", "image/png"] as const;
/** MIME-Typen und Endungen: iOS/Android bieten so Kamera, Fotomediathek und Dateien an. */
export const ERLAUBTE_ENDUNGEN = "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png";
export const MAX_GROESSE = 10 * 1024 * 1024;

export function pruefeDatei(f: File): string | null {
  const endungOk = /\.(pdf|jpe?g|png)$/i.test(f.name);
  if (!endungOk || (f.type && !(ERLAUBTE_TYPEN as readonly string[]).includes(f.type)))
    return `„${f.name}“ hat ein nicht erlaubtes Format. Erlaubt sind PDF, JPG und PNG.`;
  if (f.size > MAX_GROESSE) return `„${f.name}“ ist größer als 10 MB.`;
  if (f.size === 0) return `„${f.name}“ ist leer.`;
  return null;
}

export function formatGroesse(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
}

async function ladeAntragsdatei(d: Dokument): Promise<Blob> {
  if (!d.speicherpfad) throw new Error("Für dieses Dokument ist keine Datei gespeichert.");
  const { data, error } = await supabase().storage.from(DOKUMENTE_BUCKET).download(d.speicherpfad);
  if (error || !data) throw new Error("Das Dokument konnte nicht geladen werden.");
  return data;
}

/**
 * Zeigt eine Datei in einem neuen Tab an bzw. lädt sie herunter.
 * Die Datei wird angemeldet geladen und als lokale Blob-Adresse geöffnet:
 * Die aktuelle Seite wird nie verlassen (keine Warnung „Website verlassen?“
 * bei ungespeicherten Formularen), und es entsteht kein weitergebbarer Link.
 */
export async function zeigeDatei(
  laden: () => Promise<Blob>,
  dateiname: string,
  mimeType: string,
  herunterladen: boolean,
): Promise<void> {
  // Tab sofort öffnen, solange der Klick noch als Nutzeraktion gilt (Popup-Blocker).
  const fenster = herunterladen ? null : window.open("", "_blank");
  if (fenster) {
    try {
      fenster.document.title = dateiname;
      fenster.document.body.style.font = "16px system-ui, sans-serif";
      fenster.document.body.textContent = "Dokument wird geladen …";
    } catch {
      /* ohne Ladehinweis weiter */
    }
  }
  try {
    const roh = await laden();
    const blob = roh.type ? roh : new Blob([roh], { type: mimeType });
    if (fenster && !fenster.closed) {
      const url = URL.createObjectURL(blob);
      fenster.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
    } else {
      // Herunterladen oder Popup blockiert
      ladeBlobHerunter(blob, dateiname);
    }
  } catch (e) {
    fenster?.close();
    throw e;
  }
}

/** Öffnet das Dokument in einem neuen Tab. */
export function dokumentAnsehen(d: Dokument): Promise<void> {
  return zeigeDatei(() => ladeAntragsdatei(d), d.dateiname, d.mimeType, false);
}

export function dokumentHerunterladen(d: Dokument): Promise<void> {
  return zeigeDatei(() => ladeAntragsdatei(d), d.dateiname, d.mimeType, true);
}

export function ladeBlobHerunter(blob: Blob, dateiname: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
