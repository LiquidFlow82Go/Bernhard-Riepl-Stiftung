import { supabaseAdmin } from "@/lib/supabase/admin";
import { antwort, istRatRolle, sitzung } from "@/lib/server/zugriff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "initiativen";

/**
 * Entwurf einer Initiative löschen: nur Status „Entwurf“, nur das
 * Vorstandsmitglied, das ihn angelegt hat, oder ein Admin. Bestätigung mit
 * dem Aktenzeichen. Dateien im Speicher werden mit entfernt; das
 * Aktenzeichen wird nicht neu vergeben.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wer = await sitzung().catch(() => null);
  if (!wer) return antwort(401, { fehler: "Bitte melden Sie sich an." });
  if (!istRatRolle(wer.rolle)) return antwort(403, { fehler: "Keine Berechtigung." });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return antwort(404, { fehler: "Initiative nicht gefunden." });

  let body: { bestaetigung?: unknown };
  try {
    body = await req.json();
  } catch {
    return antwort(400, { fehler: "Ungültige Anfrage." });
  }

  const sb = supabaseAdmin();
  const { data: i } = await sb.from("initiativen").select("id, aktenzeichen, status, erstellt_von").eq("id", id).maybeSingle();
  if (!i) return antwort(404, { fehler: "Initiative nicht gefunden." });
  if (i.status !== "entwurf") return antwort(409, { fehler: "Nur Entwürfe können gelöscht werden." });
  if (i.erstellt_von !== wer.id && wer.rolle !== "admin")
    return antwort(403, { fehler: "Entwürfe kann nur löschen, wer sie angelegt hat, oder ein Admin." });
  if (typeof body.bestaetigung !== "string" || body.bestaetigung.trim().toUpperCase() !== i.aktenzeichen)
    return antwort(400, { fehler: `Bitte geben Sie zur Bestätigung das Aktenzeichen ${i.aktenzeichen} ein.` });

  const pfade = new Set<string>();
  const { data: doks } = await sb.from("initiativ_dokumente").select("speicherpfad").eq("initiative_id", i.id);
  for (const d of (doks ?? []) as { speicherpfad: string }[]) pfade.add(d.speicherpfad);
  const { data: dateien } = await sb.storage.from(BUCKET).list(i.aktenzeichen, { limit: 1000 });
  for (const f of dateien ?? []) pfade.add(`${i.aktenzeichen}/${f.name}`);
  if (pfade.size) {
    const { error } = await sb.storage.from(BUCKET).remove([...pfade]);
    if (error) return antwort(500, { fehler: "Die Dateien konnten nicht gelöscht werden. Der Entwurf bleibt erhalten." });
  }

  const { error } = await sb.from("initiativen").delete().eq("id", i.id);
  if (error) return antwort(500, { fehler: "Der Entwurf konnte nicht gelöscht werden. Bitte versuchen Sie es erneut." });
  console.info(`[initiative-loeschen] ${i.aktenzeichen} gelöscht von ${wer.id}`);
  return antwort(200, { ok: true, aktenzeichen: i.aktenzeichen });
}
