import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Zentraler E-Mail-Versand über das SMTP-Postfach der Stiftung.
 * Anbieterneutral: konfiguriert ausschließlich über Umgebungsvariablen.
 * Für Tests einfach auf ein Test-Postfach (Mailpit, Ethereal) zeigen lassen.
 *
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE
 *   MAIL_FROM          Absenderadresse (Anzeigename wird ergänzt)
 *   MAIL_STIFTUNGSRAT  Empfänger der Benachrichtigung (mehrere mit Komma)
 *   MAIL_BCC_ARCHIV    Blindkopie jeder Absage (Stiftungspostfach)
 *   NEXT_PUBLIC_SITE_URL  Basis für Links in E-Mails
 */

export type MailArt = "eingang_antragsteller" | "eingang_stiftungsrat" | "absage";

export interface MailAuftrag {
  art: MailArt;
  antragId: string;
  an: string[];
  bcc?: string[];
  betreff: string;
  html: string;
  text: string;
  /** Profil-ID der Person, die den Versand ausgelöst hat */
  ausgeloestVon?: string | null;
}

export interface MailErgebnis {
  ok: boolean;
  fehler?: string;
}

const ABSENDERNAME = "Bernhard Riepl Stiftung";

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function adressListe(wert: string): string[] {
  return wert
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s));
}

export function mailKonfiguriert(): boolean {
  return Boolean(env("SMTP_HOST") && env("MAIL_FROM"));
}

export function siteUrl(): string {
  const u = env("NEXT_PUBLIC_SITE_URL") || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return u.replace(/\/+$/, "");
}

export function stiftungsratAdressen(): string[] {
  return adressListe(env("MAIL_STIFTUNGSRAT"));
}

export function archivAdressen(): string[] {
  return adressListe(env("MAIL_BCC_ARCHIV"));
}

let transport: Transporter | null = null;

function transporter(): Transporter {
  if (transport) return transport;
  const port = Number(env("SMTP_PORT") || 587);
  const secure = env("SMTP_SECURE") ? env("SMTP_SECURE").toLowerCase() === "true" : port === 465;
  transport = nodemailer.createTransport({
    host: env("SMTP_HOST"),
    port,
    secure, // true = SSL/TLS (meist Port 465), false = STARTTLS (meist Port 587)
    auth: env("SMTP_USER") ? { user: env("SMTP_USER"), pass: env("SMTP_PASSWORD") } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  return transport;
}

/** Verständliche, nicht vertrauliche Fehlermeldung für Protokoll und Oberfläche. */
function fehlerText(e: unknown): string {
  const err = e as { code?: string; responseCode?: number; message?: string };
  if (err?.code === "EAUTH" || err?.responseCode === 535) return "Anmeldung am Mailserver fehlgeschlagen (Benutzer oder Passwort falsch).";
  if (err?.code === "ECONNECTION" || err?.code === "ETIMEDOUT" || err?.code === "ESOCKET" || err?.code === "EDNS")
    return "Mailserver nicht erreichbar (Server, Port oder Verschlüsselung prüfen).";
  if (err?.responseCode && err.responseCode >= 500) return `Mailserver hat die Nachricht abgelehnt (${err.responseCode}).`;
  return (err?.message ?? "Unbekannter Fehler beim Versand.").slice(0, 300);
}

async function protokolliere(a: MailAuftrag, ergebnis: MailErgebnis): Promise<void> {
  try {
    await supabaseAdmin()
      .from("mail_log")
      .insert({
        antrag_id: a.antragId,
        art: a.art,
        empfaenger: a.an.join(", ").slice(0, 500),
        erfolgreich: ergebnis.ok,
        fehler: ergebnis.fehler ?? null,
        ausgeloest_von: a.ausgeloestVon ?? null,
      });
  } catch (e) {
    console.error("[mail] Protokoll konnte nicht geschrieben werden", e);
  }
}

/** Versendet eine E-Mail und schreibt das Ergebnis ins Protokoll. Wirft nie. */
export async function sendeMail(a: MailAuftrag): Promise<MailErgebnis> {
  let ergebnis: MailErgebnis;
  if (!mailKonfiguriert()) {
    ergebnis = { ok: false, fehler: "E-Mail-Versand ist nicht eingerichtet (SMTP_HOST bzw. MAIL_FROM fehlt)." };
  } else if (a.an.length === 0) {
    ergebnis = { ok: false, fehler: "Keine gültige Empfängeradresse." };
  } else {
    try {
      await transporter().sendMail({
        from: { name: ABSENDERNAME, address: env("MAIL_FROM") },
        to: a.an,
        bcc: a.bcc && a.bcc.length ? a.bcc : undefined,
        subject: a.betreff,
        html: a.html,
        text: a.text,
        headers: { "Auto-Submitted": "auto-generated" },
      });
      ergebnis = { ok: true };
    } catch (e) {
      ergebnis = { ok: false, fehler: fehlerText(e) };
      console.error(`[mail] Versand fehlgeschlagen (${a.art}, Antrag ${a.antragId}):`, ergebnis.fehler);
    }
  }
  await protokolliere(a, ergebnis);
  return ergebnis;
}

/** Letzter Protokolleintrag je Art (für Wiederholungssperre und Anzeige). */
export async function letzteVersuche(antragId: string, art: MailArt) {
  const { data } = await supabaseAdmin()
    .from("mail_log")
    .select("zeitpunkt, erfolgreich")
    .eq("antrag_id", antragId)
    .eq("art", art)
    .order("zeitpunkt", { ascending: false })
    .limit(20);
  return (data ?? []) as { zeitpunkt: string; erfolgreich: boolean }[];
}
