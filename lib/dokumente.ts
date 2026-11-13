/**
 * Dokumente zu Anträgen.
 * Phase 1: Hochgeladene Dateien bleiben nur im Browser-Speicher dieser Sitzung.
 * Für Beispieldokumente wird ein Platzhalter-PDF erzeugt.
 * Phase 2: Upload in Supabase Storage (Bucket aus SUPABASE_STORAGE_BUCKET),
 * Ansehen/Herunterladen über signierte URLs.
 */
import { DOKUMENT_LABEL, type Dokument } from "./types";

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

/** Dateien dieser Browsersitzung, nach Dokument-ID (nur Phase 1). */
const sitzungsDateien = new Map<string, File>();

export function merkeDatei(dokumentId: string, f: File): void {
  sitzungsDateien.set(dokumentId, f);
}

async function platzhalterPdf(d: Dokument): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Beispieldokument (Phase 1)", 20, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize(
      `${DOKUMENT_LABEL[d.kategorie]}\nDatei: ${d.dateiname}\n\nDie echte Datei wird ab Phase 2 aus dem Dokumentenspeicher geladen.`,
      170,
    ),
    20,
    45,
  );
  return doc.output("blob");
}

export async function ladeDokumentBlob(d: Dokument): Promise<Blob> {
  return sitzungsDateien.get(d.id) ?? (await platzhalterPdf(d));
}

export async function dokumentAnsehen(d: Dokument): Promise<void> {
  const blob = await ladeDokumentBlob(d);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function dokumentHerunterladen(d: Dokument): Promise<void> {
  const blob = await ladeDokumentBlob(d);
  ladeBlobHerunter(blob, sitzungsDateien.has(d.id) ? d.dateiname : d.dateiname.replace(/\.\w+$/, "") + "_Beispiel.pdf");
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
