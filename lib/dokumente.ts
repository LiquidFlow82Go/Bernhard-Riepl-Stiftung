/**
 * Dokumente zu Anträgen. Die Dateien liegen im privaten Supabase-Bucket
 * „antragsdokumente“; Ansehen und Herunterladen laufen über kurzlebige,
 * signierte Links. Wer was sehen darf, regeln die Storage-Policies.
 */
import { DOKUMENTE_BUCKET } from "./supabase/env";
import { supabase } from "./supabase/client";
import type { Dokument } from "./types";

export const ERLAUBTE_TYPEN = ["application/pdf", "image/jpeg", "image/png"] as const;
export const ERLAUBTE_ENDUNGEN = ".pdf,.jpg,.jpeg,.png";
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

async function signierterLink(d: Dokument, herunterladen: boolean): Promise<string> {
  if (!d.speicherpfad) throw new Error("Für dieses Dokument ist keine Datei gespeichert.");
  const { data, error } = await supabase()
    .storage.from(DOKUMENTE_BUCKET)
    .createSignedUrl(d.speicherpfad, 120, herunterladen ? { download: d.dateiname } : undefined);
  if (error || !data) throw new Error("Das Dokument konnte nicht geladen werden.");
  return data.signedUrl;
}

/** Öffnet das Dokument in einem neuen Tab. */
export async function dokumentAnsehen(d: Dokument): Promise<void> {
  // Fenster sofort öffnen, damit der Popup-Blocker den Klick erkennt.
  const fenster = window.open("about:blank", "_blank");
  try {
    const url = await signierterLink(d, false);
    if (fenster) {
      fenster.opener = null;
      fenster.location.href = url;
    } else {
      window.location.href = url;
    }
  } catch (e) {
    fenster?.close();
    throw e;
  }
}

export async function dokumentHerunterladen(d: Dokument): Promise<void> {
  const url = await signierterLink(d, true);
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
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
