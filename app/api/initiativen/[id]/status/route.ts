import { fehltFuerStatus } from "@/lib/initiativeSchema";
import { INITIATIV_STATUS, vervollstaendige, type InitiativStatus } from "@/lib/initiativeTypen";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { antwort, istRatRolle, sitzung } from "@/lib/server/zugriff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Status einer Initiative ändern (nur Stiftungsvorstand/Admin, serverseitig geprüft).
 * Vorwärts nur, wenn die nötigen Angaben vollständig sind (gleiches Schema wie
 * im Formular); zurück nur mit Begründung. Der Verlauf wird in der Datenbank
 * mit Datum und Vorstandsmitglied gespeichert.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wer = await sitzung().catch(() => null);
  if (!wer) return antwort(401, { fehler: "Bitte melden Sie sich an." });
  if (!istRatRolle(wer.rolle)) return antwort(403, { fehler: "Nur der Stiftungsvorstand darf den Status ändern." });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return antwort(404, { fehler: "Initiative nicht gefunden." });

  let body: { status?: unknown; grund?: unknown };
  try {
    body = await req.json();
  } catch {
    return antwort(400, { fehler: "Ungültige Anfrage." });
  }
  const status = body.status as InitiativStatus;
  const grund = typeof body.grund === "string" ? body.grund.trim().slice(0, 1000) : "";
  if (!INITIATIV_STATUS.includes(status)) return antwort(400, { fehler: "Unbekannter Status." });

  const sb = supabaseAdmin();
  const { data: zeile } = await sb.from("initiativen").select("id, status, daten").eq("id", id).maybeSingle();
  if (!zeile) return antwort(404, { fehler: "Initiative nicht gefunden." });
  const alt = zeile.status as InitiativStatus;
  if (alt === status) return antwort(409, { fehler: "Der Status ist bereits gesetzt." });

  const vorwaerts = INITIATIV_STATUS.indexOf(status) > INITIATIV_STATUS.indexOf(alt);
  if (vorwaerts) {
    const { data: doks } = await sb.from("initiativ_dokumente").select("kategorie").eq("initiative_id", id);
    const fehlend = fehltFuerStatus(vervollstaendige(zeile.daten), status, (doks ?? []) as { kategorie: string }[]);
    if (Object.keys(fehlend).length)
      return antwort(422, { fehler: "Für diesen Status fehlen noch Angaben.", fehlend });
  } else if (!grund) {
    return antwort(400, { fehler: "Bitte begründen Sie kurz, warum der Status zurückgesetzt wird." });
  }

  const { error } = await sb.rpc("initiative_status_setzen", {
    p_id: id,
    p_status: status,
    p_grund: grund,
    p_mitglied: wer.id,
  });
  if (error) {
    console.error("[initiative-status]", error.message);
    return antwort(500, { fehler: "Der Status konnte nicht gespeichert werden. Bitte versuchen Sie es erneut." });
  }
  return antwort(200, { ok: true });
}
