import { eingangsbestaetigung, neuerAntragRat } from "@/content/mailVorlagen";
import { adressListe, letzteVersuche, sendeMail, siteUrl, stiftungsratAdressen, type MailArt } from "@/lib/mail";
import { antwort, datumDe, euro, istRatRolle, ladeAntragKern, MINUTEN, sitzung } from "@/lib/server/zugriff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ergebnis = { status: "gesendet" | "fehlgeschlagen" | "bereits_gesendet" | "gesperrt"; fehler?: string };

/**
 * E-Mails nach dem Absenden eines Antrags:
 *  1. Eingangsbestätigung an die Konto-Adresse des Antragstellers
 *  2. Benachrichtigung an den Stiftungsvorstand (MAIL_STIFTUNGSRAT)
 *
 * Antragsteller: nur für den eigenen Antrag, innerhalb von 24 Stunden nach dem
 * Absenden und je E-Mail nur einmal erfolgreich.
 * Stiftungsvorstand: kann die Benachrichtigung (2) erneut senden.
 * Empfänger stammen nie aus der Anfrage.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wer = await sitzung().catch(() => null);
  if (!wer) return antwort(401, { fehler: "Bitte melden Sie sich an." });

  const antrag = await ladeAntragKern(id).catch(() => null);
  if (!antrag) return antwort(404, { fehler: "Antrag nicht gefunden." });

  let arten: MailArt[];
  if (istRatRolle(wer.rolle)) {
    arten = ["eingang_stiftungsrat"];
  } else {
    if (antrag.benutzer_id !== wer.id) return antwort(404, { fehler: "Antrag nicht gefunden." });
    if (Date.now() - new Date(antrag.eingereicht_am).getTime() > 24 * 60 * MINUTEN)
      return antwort(409, { fehler: "Die Benachrichtigung kann nur direkt nach dem Absenden ausgelöst werden." });
    arten = ["eingang_antragsteller", "eingang_stiftungsrat"];
  }

  const basis = siteUrl();
  const ergebnisse: Partial<Record<MailArt, Ergebnis>> = {};

  for (const art of arten) {
    const versuche = await letzteVersuche(antrag.id, art);
    if (wer.rolle === "antragsteller" && versuche.some((v) => v.erfolgreich)) {
      ergebnisse[art] = { status: "bereits_gesendet" };
      continue;
    }
    if (versuche[0] && Date.now() - new Date(versuche[0].zeitpunkt).getTime() < 2 * MINUTEN) {
      ergebnisse[art] = { status: "gesperrt", fehler: "Bitte warten Sie zwei Minuten, bevor Sie es erneut versuchen." };
      continue;
    }

    const titel = antrag.projekt_titel ?? "";
    const mail =
      art === "eingang_antragsteller"
        ? eingangsbestaetigung({
            siteUrl: basis,
            antragsnummer: antrag.nummer,
            projekttitel: titel,
            datum: datumDe(antrag.eingereicht_am),
            link: `${basis}/konto/antraege/${antrag.id}`,
          })
        : neuerAntragRat({
            siteUrl: basis,
            antragsnummer: antrag.nummer,
            institution: antrag.antragsteller_name ?? "",
            projekttitel: titel,
            betrag: euro(antrag.betrag_beantragt),
            link: `${basis}/stiftungsvorstand/antraege/${antrag.id}`,
          });

    const an = art === "eingang_antragsteller" ? adressListe(antrag.konto_email) : stiftungsratAdressen();
    const r = await sendeMail({ art, antragId: antrag.id, an, ...mail, ausgeloestVon: wer.id });
    ergebnisse[art] = r.ok ? { status: "gesendet" } : { status: "fehlgeschlagen", fehler: r.fehler };
  }

  return antwort(200, { ergebnisse });
}
