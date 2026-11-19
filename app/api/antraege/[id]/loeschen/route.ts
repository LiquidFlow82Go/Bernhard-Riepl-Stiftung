import { supabaseAdmin } from "@/lib/supabase/admin";
import { DOKUMENTE_BUCKET } from "@/lib/supabase/env";
import { antwort, ladeAntragKern, sitzung } from "@/lib/server/zugriff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Antrag endgültig löschen – nur Admins, serverseitig geprüft.
 * Zur Bestätigung muss die Antragsnummer mitgeschickt werden.
 * Ablauf: erst alle Dateien des Antrags im Storage entfernen, dann den
 * Antrag; Dokument-Einträge, Absagen, Bewilligungen und Mailprotokoll
 * folgen per Kaskade in der Datenbank.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wer = await sitzung().catch(() => null);
  if (!wer) return antwort(401, { fehler: "Bitte melden Sie sich an." });
  if (wer.rolle !== "admin") return antwort(403, { fehler: "Nur Admins dürfen Anträge löschen." });

  let body: { bestaetigung?: unknown };
  try {
    body = await req.json();
  } catch {
    return antwort(400, { fehler: "Ungültige Anfrage." });
  }

  const antrag = await ladeAntragKern(id).catch(() => null);
  if (!antrag) return antwort(404, { fehler: "Antrag nicht gefunden." });
  if (typeof body.bestaetigung !== "string" || body.bestaetigung.trim() !== antrag.nummer)
    return antwort(400, { fehler: `Bitte geben Sie zur Bestätigung die Antragsnummer ${antrag.nummer} ein.` });

  const sb = supabaseAdmin();

  // Alle Dateien im Ordner des Antrags (auch solche ohne Dokument-Eintrag)
  const pfade = new Set<string>();
  const { data: dokumente } = await sb.from("dokumente").select("speicherpfad").eq("antrag_id", antrag.id);
  for (const d of (dokumente ?? []) as { speicherpfad: string | null }[]) if (d.speicherpfad) pfade.add(d.speicherpfad);
  const { data: dateien } = await sb.storage.from(DOKUMENTE_BUCKET).list(antrag.id, { limit: 1000 });
  for (const f of dateien ?? []) pfade.add(`${antrag.id}/${f.name}`);

  if (pfade.size) {
    const { error } = await sb.storage.from(DOKUMENTE_BUCKET).remove([...pfade]);
    if (error) {
      console.error("[loeschen] Dateien konnten nicht entfernt werden:", error.message);
      return antwort(500, { fehler: "Die Dateien des Antrags konnten nicht gelöscht werden. Der Antrag bleibt unverändert." });
    }
  }

  const { error } = await sb.from("antraege").delete().eq("id", antrag.id);
  if (error) {
    console.error("[loeschen] Antrag konnte nicht gelöscht werden:", error.message);
    return antwort(500, {
      fehler: "Die Dateien wurden entfernt, der Antrag selbst konnte aber nicht gelöscht werden. Bitte versuchen Sie es erneut.",
    });
  }
  console.info(`[loeschen] Antrag ${antrag.nummer} gelöscht von ${wer.id} (${pfade.size} Dateien)`);
  return antwort(200, { ok: true, nummer: antrag.nummer });
}
