import { ABSAGE_VORLAGEN } from "@/content/absageVorlagen";
import { absage } from "@/content/mailVorlagen";
import { adressListe, archivAdressen, letzteVersuche, sendeMail, siteUrl } from "@/lib/mail";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { antwort, istRatRolle, ladeAntragKern, MINUTEN, sitzung } from "@/lib/server/zugriff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Absage versenden (nur Stiftungsvorstand, serverseitig geprüft).
 * Ablauf: E-Mail an die Konto-Adresse des Antragstellers, BCC an MAIL_BCC_ARCHIV.
 * Erst nach erfolgreichem Versand wird der Status auf „Abgelehnt“ gesetzt und
 * der tatsächlich gesendete Text gespeichert. Schlägt der Versand fehl, bleibt
 * der Status unverändert.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wer = await sitzung().catch(() => null);
  if (!wer) return antwort(401, { fehler: "Bitte melden Sie sich an." });
  if (!istRatRolle(wer.rolle)) return antwort(403, { fehler: "Nur der Stiftungsvorstand darf Absagen versenden." });

  let body: { grundId?: unknown; betreff?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return antwort(400, { fehler: "Ungültige Anfrage." });
  }
  const vorlage = ABSAGE_VORLAGEN.find((v) => v.id === body.grundId);
  const betreff = typeof body.betreff === "string" ? body.betreff.replace(/[\r\n]+/g, " ").trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!vorlage) return antwort(400, { fehler: "Unbekannter Ausschlussgrund." });
  if (!betreff || betreff.length > 200) return antwort(400, { fehler: "Bitte geben Sie einen Betreff mit höchstens 200 Zeichen an." });
  if (!text || text.length > 20_000) return antwort(400, { fehler: "Der Absagetext fehlt oder ist zu lang." });

  const antrag = await ladeAntragKern(id).catch(() => null);
  if (!antrag) return antwort(404, { fehler: "Antrag nicht gefunden." });
  if (antrag.status === "abgelehnt") return antwort(409, { fehler: "Dieser Antrag ist bereits abgelehnt." });

  const versuche = await letzteVersuche(antrag.id, "absage");
  const juengst = versuche[0] ? Date.now() - new Date(versuche[0].zeitpunkt).getTime() : Infinity;
  if (versuche.some((v) => v.erfolgreich && Date.now() - new Date(v.zeitpunkt).getTime() < 10 * MINUTEN))
    return antwort(429, { fehler: "Für diesen Antrag wurde gerade eine Absage versendet." });
  if (juengst < 20_000) return antwort(429, { fehler: "Bitte warten Sie einen Moment, bevor Sie es erneut versuchen." });

  const an = adressListe(antrag.konto_email);
  const mail = absage({ siteUrl: siteUrl(), betreff, text });
  const versand = await sendeMail({
    art: "absage",
    antragId: antrag.id,
    an,
    bcc: archivAdressen(),
    ...mail,
    ausgeloestVon: wer.id,
  });
  if (!versand.ok) {
    return antwort(502, {
      fehler: `Die Absage konnte nicht versendet werden: ${versand.fehler} Der Status bleibt unverändert, Ihr Text ist erhalten.`,
    });
  }

  const { error } = await supabaseAdmin().rpc("absage_speichern", {
    p_antrag_id: antrag.id,
    p_grund_id: vorlage.id,
    p_grund_titel: vorlage.titel,
    p_betreff: betreff,
    p_text: mail.text,
    p_empfaenger: an.join(", "),
    p_ratsmitglied: wer.id,
  });
  if (error) {
    console.error("[absage] Versendet, aber nicht gespeichert:", error.message);
    return antwort(500, {
      fehler: "Die E-Mail wurde versendet, der Status konnte aber nicht gespeichert werden. Bitte senden Sie die Absage nicht erneut und wenden Sie sich an den Administrator.",
    });
  }
  return antwort(200, { ok: true });
}
