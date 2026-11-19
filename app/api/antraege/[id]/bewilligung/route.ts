import { bewilligung, offenePlatzhalter } from "@/content/mailVorlagen";
import { adressListe, archivAdressen, letzteVersuche, sendeMail, siteUrl } from "@/lib/mail";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { antwort, istRatRolle, ladeAntragKern, MINUTEN, sitzung } from "@/lib/server/zugriff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Antrag bewilligen (nur Stiftungsvorstand/Admin, serverseitig geprüft).
 * - mitMail = true:  E-Mail an die Konto-Adresse, BCC an MAIL_BCC_ARCHIV.
 *                    Erst nach erfolgreichem Versand wird der Status gesetzt.
 * - mitMail = false: Status und Betrag ohne E-Mail setzen.
 * Gespeichert werden Betrag, gesendeter Text, Datum und Vorstandsmitglied.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wer = await sitzung().catch(() => null);
  if (!wer) return antwort(401, { fehler: "Bitte melden Sie sich an." });
  if (!istRatRolle(wer.rolle)) return antwort(403, { fehler: "Nur der Stiftungsvorstand darf Anträge bewilligen." });

  let body: { betrag?: unknown; mitMail?: unknown; betreff?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return antwort(400, { fehler: "Ungültige Anfrage." });
  }
  const betrag = typeof body.betrag === "number" ? Math.round(body.betrag * 100) / 100 : NaN;
  const mitMail = body.mitMail === true;
  const betreff = typeof body.betreff === "string" ? body.betreff.replace(/[\r\n]+/g, " ").trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!Number.isFinite(betrag) || betrag <= 0 || betrag > 10_000_000)
    return antwort(400, { fehler: "Bitte geben Sie einen bewilligten Betrag größer 0 an." });
  if (mitMail) {
    if (!betreff || betreff.length > 200) return antwort(400, { fehler: "Bitte geben Sie einen Betreff mit höchstens 200 Zeichen an." });
    if (!text || text.length > 20_000) return antwort(400, { fehler: "Der Text der E-Mail fehlt oder ist zu lang." });
    const offen = offenePlatzhalter(text);
    if (offen.length) return antwort(400, { fehler: `Bitte ergänzen Sie zuerst: ${offen.join(", ")}.` });
  }

  const antrag = await ladeAntragKern(id).catch(() => null);
  if (!antrag) return antwort(404, { fehler: "Antrag nicht gefunden." });
  if (antrag.status === "bewilligt") return antwort(409, { fehler: "Dieser Antrag ist bereits bewilligt." });
  if (antrag.status === "abgelehnt") return antwort(409, { fehler: "Dieser Antrag ist abgelehnt und kann nicht bewilligt werden." });

  const an = adressListe(antrag.konto_email);
  let gesendet: { betreff: string; text: string } | null = null;

  if (mitMail) {
    const versuche = await letzteVersuche(antrag.id, "bewilligung");
    if (versuche.some((v) => v.erfolgreich && Date.now() - new Date(v.zeitpunkt).getTime() < 10 * MINUTEN))
      return antwort(429, { fehler: "Für diesen Antrag wurde gerade eine Bewilligung versendet." });
    if (versuche[0] && Date.now() - new Date(versuche[0].zeitpunkt).getTime() < 20_000)
      return antwort(429, { fehler: "Bitte warten Sie einen Moment, bevor Sie es erneut versuchen." });

    const mail = bewilligung({ siteUrl: siteUrl(), betreff, text });
    const versand = await sendeMail({ art: "bewilligung", antragId: antrag.id, an, bcc: archivAdressen(), ...mail, ausgeloestVon: wer.id });
    if (!versand.ok)
      return antwort(502, {
        fehler: `Die E-Mail konnte nicht versendet werden: ${versand.fehler} Der Status bleibt unverändert, Ihr Text ist erhalten.`,
      });
    gesendet = { betreff, text: mail.text };
  }

  const { error } = await supabaseAdmin().rpc("bewilligung_speichern", {
    p_antrag_id: antrag.id,
    p_betrag: betrag,
    p_mail_gesendet: Boolean(gesendet),
    p_betreff: gesendet?.betreff ?? null,
    p_text: gesendet?.text ?? null,
    p_empfaenger: gesendet ? an.join(", ") : null,
    p_ratsmitglied: wer.id,
  });
  if (error) {
    console.error("[bewilligung] nicht gespeichert:", error.message);
    return antwort(500, {
      fehler: gesendet
        ? "Die E-Mail wurde versendet, der Status konnte aber nicht gespeichert werden. Bitte senden Sie die Bewilligung nicht erneut und wenden Sie sich an den Administrator."
        : "Die Bewilligung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    });
  }
  return antwort(200, { ok: true });
}
