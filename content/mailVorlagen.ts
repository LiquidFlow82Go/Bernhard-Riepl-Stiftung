/**
 * Vorlagen für die E-Mails der Webseite (getrennt vom Versandcode in lib/mail.ts).
 *
 * Grundsätze:
 * - Anrede „Sie“, schlichtes Tabellen-HTML, das auch in Outlook funktioniert.
 * - Jede Vorlage liefert Betreff, HTML- und Textfassung.
 * - Alle Werte aus Nutzereingaben werden mit esc() maskiert.
 * - Keine Antragsdetails oder Bankdaten – nur die genannten Angaben und ein Link.
 */

export interface Mail {
  betreff: string;
  html: string;
  text: string;
}

/** Maskiert Text für HTML. */
export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Mehrzeiliger Text → HTML-Absätze (maskiert). */
function absaetze(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px 0;">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

const ABSENDER_ZEILEN = ["Bernhard Riepl Stiftung", "Stadlbergstraße 56", "83714 Miesbach"];

/** Gemeinsamer Rahmen im Stil der Webseite (warmes Fast-Weiß, dunkle Schrift). */
export function rahmen(o: { siteUrl: string; vorspann: string; inhalt: string }): string {
  const logo = `${o.siteUrl}/icon-512.png`;
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Bernhard Riepl Stiftung</title>
</head>
<body style="margin:0; padding:0; background-color:#fdfaf9;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${esc(o.vorspann)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fdfaf9;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border:1px solid #cdc9c6;">
        <tr>
          <td style="padding:28px 32px 20px 32px; border-bottom:1px solid #cdc9c6;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right:12px; vertical-align:middle;">
                  <img src="${esc(logo)}" width="40" height="40" alt="" style="display:block; border:0;">
                </td>
                <td style="vertical-align:middle; font-family:Arial, Helvetica, sans-serif; font-size:20px; line-height:24px; color:#0f0b08;">
                  Bernhard Riepl Stiftung
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px 32px; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:24px; color:#0f0b08;">
${o.inhalt}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px 32px; border-top:1px solid #cdc9c6; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#49433f;">
            ${ABSENDER_ZEILEN.map(esc).join("<br>")}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Button, der auch in Outlook als Fläche erscheint. */
export function button(href: string, beschriftung: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;">
  <tr>
    <td bgcolor="#0f0b08" style="border-radius:24px;">
      <a href="${esc(href)}" style="display:inline-block; padding:12px 24px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:20px; color:#ffffff; text-decoration:none; border-radius:24px;">${esc(beschriftung)}</a>
    </td>
  </tr>
</table>`;
}

function angabenTabelle(zeilen: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0; border-top:1px solid #cdc9c6;">
${zeilen
  .map(
    ([k, v]) => `  <tr>
    <td style="padding:10px 12px 10px 0; border-bottom:1px solid #cdc9c6; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:20px; color:#49433f; width:40%; vertical-align:top;">${esc(k)}</td>
    <td style="padding:10px 0; border-bottom:1px solid #cdc9c6; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:20px; color:#0f0b08; vertical-align:top;">${esc(v)}</td>
  </tr>`,
  )
  .join("\n")}
</table>`;
}

function textAngaben(zeilen: [string, string][]): string {
  return zeilen.map(([k, v]) => `${k}: ${v}`).join("\n");
}

const GRUSS_TEXT = `Mit freundlichen Grüßen\nBernhard Riepl Stiftung\n${ABSENDER_ZEILEN.slice(1).join(" · ")}`;
const GRUSS_HTML = `<p style="margin:0 0 16px 0;">Mit freundlichen Grüßen<br>Bernhard Riepl Stiftung</p>`;

/* ---------- 1. Eingangsbestätigung an den Antragsteller ---------- */

export function eingangsbestaetigung(d: {
  siteUrl: string;
  antragsnummer: string;
  projekttitel: string;
  datum: string;
  link: string;
}): Mail {
  const angaben: [string, string][] = [
    ["Antragsnummer", d.antragsnummer],
    ["Projekt", d.projekttitel],
    ["Eingegangen am", d.datum],
  ];
  const betreff = `Eingangsbestätigung Ihres Förderantrags ${d.antragsnummer}`;
  const html = rahmen({
    siteUrl: d.siteUrl,
    vorspann: `Ihr Förderantrag ${d.antragsnummer} ist bei uns eingegangen.`,
    inhalt: `<p style="margin:0 0 16px 0;">Sehr geehrte Damen und Herren,</p>
<p style="margin:0 0 16px 0;">vielen Dank für Ihren Antrag. Er ist bei der Bernhard Riepl Stiftung eingegangen und wird vom Stiftungsrat geprüft.</p>
${angabenTabelle(angaben)}
<p style="margin:0 0 16px 0;">Den Stand Ihres Antrags und eine Kopie als PDF finden Sie jederzeit in Ihrem Konto:</p>
${button(d.link, "Antrag ansehen")}
<p style="margin:0 0 16px 0;">Bitte geben Sie bei Rückfragen Ihre Antragsnummer an.</p>
${GRUSS_HTML}`,
  });
  const text = `Sehr geehrte Damen und Herren,

vielen Dank für Ihren Antrag. Er ist bei der Bernhard Riepl Stiftung eingegangen und wird vom Stiftungsrat geprüft.

${textAngaben(angaben)}

Den Stand Ihres Antrags und eine Kopie als PDF finden Sie jederzeit in Ihrem Konto:
${d.link}

Bitte geben Sie bei Rückfragen Ihre Antragsnummer an.

${GRUSS_TEXT}`;
  return { betreff, html, text };
}

/* ---------- 2. Benachrichtigung an den Stiftungsrat ---------- */

export function neuerAntragRat(d: {
  siteUrl: string;
  antragsnummer: string;
  institution: string;
  projekttitel: string;
  betrag: string;
  link: string;
}): Mail {
  const angaben: [string, string][] = [
    ["Antragsnummer", d.antragsnummer],
    ["Institution", d.institution],
    ["Projekt", d.projekttitel],
    ["Beantragte Förderung", d.betrag],
  ];
  const betreff = `Neuer Förderantrag ${d.antragsnummer}: ${d.projekttitel}`.slice(0, 180);
  const html = rahmen({
    siteUrl: d.siteUrl,
    vorspann: `Neuer Förderantrag ${d.antragsnummer} von ${d.institution}.`,
    inhalt: `<p style="margin:0 0 16px 0;">Guten Tag,</p>
<p style="margin:0 0 16px 0;">über die Webseite ist ein neuer Förderantrag eingegangen.</p>
${angabenTabelle(angaben)}
<p style="margin:0 0 16px 0;">Alle Angaben, das PDF und die hochgeladenen Dokumente finden Sie nach der Anmeldung im Bereich des Stiftungsrats:</p>
${button(d.link, "Antrag öffnen")}
<p style="margin:0 0 16px 0; font-size:13px; line-height:20px; color:#49433f;">Diese Nachricht wurde automatisch von der Webseite versendet.</p>`,
  });
  const text = `Guten Tag,

über die Webseite ist ein neuer Förderantrag eingegangen.

${textAngaben(angaben)}

Alle Angaben, das PDF und die hochgeladenen Dokumente finden Sie nach der Anmeldung im Bereich des Stiftungsrats:
${d.link}

Diese Nachricht wurde automatisch von der Webseite versendet.`;
  return { betreff, html, text };
}

/* ---------- 3. Nachgereichte Unterlagen (an den Stiftungsrat) ---------- */

export function neueUnterlagenRat(d: {
  siteUrl: string;
  antragsnummer: string;
  institution: string;
  projekttitel: string;
  anzahl: number;
  link: string;
}): Mail {
  const angaben: [string, string][] = [
    ["Antragsnummer", d.antragsnummer],
    ["Institution", d.institution],
    ["Projekt", d.projekttitel],
    ["Neue Dateien", String(d.anzahl)],
  ];
  const betreff = `Unterlagen nachgereicht zu Antrag ${d.antragsnummer}`;
  const html = rahmen({
    siteUrl: d.siteUrl,
    vorspann: `Zu Antrag ${d.antragsnummer} wurden Unterlagen nachgereicht.`,
    inhalt: `<p style="margin:0 0 16px 0;">Guten Tag,</p>
<p style="margin:0 0 16px 0;">zu einem Förderantrag wurden über die Webseite Unterlagen nachgereicht.</p>
${angabenTabelle(angaben)}
<p style="margin:0 0 16px 0;">Die Dokumente finden Sie nach der Anmeldung im Bereich des Stiftungsrats:</p>
${button(d.link, "Antrag öffnen")}
<p style="margin:0 0 16px 0; font-size:13px; line-height:20px; color:#49433f;">Diese Nachricht wurde automatisch von der Webseite versendet.</p>`,
  });
  const text = `Guten Tag,

zu einem Förderantrag wurden über die Webseite Unterlagen nachgereicht.

${textAngaben(angaben)}

Die Dokumente finden Sie nach der Anmeldung im Bereich des Stiftungsrats:
${d.link}

Diese Nachricht wurde automatisch von der Webseite versendet.`;
  return { betreff, html, text };
}

/* ---------- 4. Absage ---------- */

/** Betreff und Text stammen aus dem Absagedialog (vom Ratsmitglied bearbeitet). */
export function absage(d: { siteUrl: string; betreff: string; text: string }): Mail {
  const html = rahmen({
    siteUrl: d.siteUrl,
    vorspann: d.betreff,
    inhalt: absaetze(d.text),
  });
  return { betreff: d.betreff, html, text: d.text.replace(/\r\n?/g, "\n").trim() };
}
