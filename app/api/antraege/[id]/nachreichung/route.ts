import { neueUnterlagenRat } from "@/content/mailVorlagen";
import { letzteVersuche, sendeMail, siteUrl, stiftungsratAdressen } from "@/lib/mail";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { antwort, ladeAntragKern, MINUTEN, sitzung } from "@/lib/server/zugriff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hinweis an den Stiftungsrat (MAIL_STIFTUNGSRAT), dass Unterlagen nachgereicht wurden.
 * Nur der Antragsteller des eigenen Antrags, nur wenn in den letzten 30 Minuten
 * tatsächlich Dokumente nachgereicht wurden, höchstens alle 5 Minuten.
 * Empfänger stammen nie aus der Anfrage.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wer = await sitzung().catch(() => null);
  if (!wer) return antwort(401, { fehler: "Bitte melden Sie sich an." });

  const antrag = await ladeAntragKern(id).catch(() => null);
  if (!antrag || antrag.benutzer_id !== wer.id) return antwort(404, { fehler: "Antrag nicht gefunden." });

  const seit = new Date(Date.now() - 30 * MINUTEN).toISOString();
  const { count } = await supabaseAdmin()
    .from("dokumente")
    .select("id", { count: "exact", head: true })
    .eq("antrag_id", antrag.id)
    .eq("nachgereicht", true)
    .gte("hochgeladen_am", seit);
  if (!count) return antwort(409, { fehler: "Es wurden keine neuen Unterlagen gefunden." });

  const versuche = await letzteVersuche(antrag.id, "nachreichung");
  if (versuche[0] && Date.now() - new Date(versuche[0].zeitpunkt).getTime() < 5 * MINUTEN)
    return antwort(200, { ergebnis: { status: "gesperrt", fehler: "Der Stiftungsrat wurde vor wenigen Minuten bereits informiert." } });

  const basis = siteUrl();
  const mail = neueUnterlagenRat({
    siteUrl: basis,
    antragsnummer: antrag.nummer,
    institution: antrag.antragsteller_name ?? "",
    projekttitel: antrag.projekt_titel ?? "",
    anzahl: count,
    link: `${basis}/stiftungsrat/antraege/${antrag.id}`,
  });
  const r = await sendeMail({ art: "nachreichung", antragId: antrag.id, an: stiftungsratAdressen(), ...mail, ausgeloestVon: wer.id });
  return antwort(200, { ergebnis: r.ok ? { status: "gesendet" } : { status: "fehlgeschlagen", fehler: r.fehler } });
}
