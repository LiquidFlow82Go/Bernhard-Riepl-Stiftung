/**
 * Schnittstelle der Oberfläche zum E-Mail-Versand.
 * Der eigentliche Versand läuft serverseitig (lib/mail.ts) über die
 * Route Handler unter /api/antraege/[id]/… – Zugangsdaten gelangen nie in den Browser.
 */

export type MailStatus = "gesendet" | "fehlgeschlagen" | "bereits_gesendet" | "gesperrt";

export interface MailRueckmeldung {
  status: MailStatus;
  fehler?: string;
}

export interface EingangErgebnis {
  antragsteller?: MailRueckmeldung;
  stiftungsrat?: MailRueckmeldung;
}

async function post(url: string, body?: unknown): Promise<{ ok: boolean; daten: Record<string, unknown> }> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
    const daten = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: r.ok, daten };
  } catch {
    return { ok: false, daten: { fehler: "Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung." } };
  }
}

/** Nach dem Absenden: Eingangsbestätigung und Benachrichtigung des Stiftungsrats. Wirft nie. */
export async function sendeEingangsbestaetigung(antragId: string): Promise<EingangErgebnis> {
  const { daten } = await post(`/api/antraege/${antragId}/benachrichtigen`);
  const e = (daten.ergebnisse ?? {}) as Record<string, MailRueckmeldung>;
  return { antragsteller: e.eingang_antragsteller, stiftungsrat: e.eingang_stiftungsrat };
}

/** Stiftungsrat: Benachrichtigung zu einem Antrag erneut senden. */
export async function benachrichtigungErneutSenden(antragId: string): Promise<{ ok: boolean; fehler?: string }> {
  const { ok, daten } = await post(`/api/antraege/${antragId}/benachrichtigen`);
  const r = (daten.ergebnisse as Record<string, MailRueckmeldung> | undefined)?.eingang_stiftungsrat;
  if (ok && r?.status === "gesendet") return { ok: true };
  return { ok: false, fehler: r?.fehler ?? (daten.fehler as string) ?? "Die Benachrichtigung konnte nicht gesendet werden." };
}

/** Stiftungsrat: Absage versenden. Der Status wird serverseitig erst nach erfolgreichem Versand gesetzt. */
export async function sendeAbsage(n: {
  antragId: string;
  grundId: string;
  betreff: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; fehler: string }> {
  const { ok, daten } = await post(`/api/antraege/${n.antragId}/absage`, {
    grundId: n.grundId,
    betreff: n.betreff,
    text: n.text,
  });
  if (ok) return { ok: true };
  return { ok: false, fehler: (daten.fehler as string) ?? "Die Absage konnte nicht versendet werden." };
}

/** Antragsteller: Stiftungsrat über nachgereichte Unterlagen informieren. Wirft nie. */
export async function meldeNachreichung(antragId: string): Promise<MailRueckmeldung> {
  const { daten } = await post(`/api/antraege/${antragId}/nachreichung`);
  return (daten.ergebnis as MailRueckmeldung | undefined) ?? { status: "fehlgeschlagen", fehler: (daten.fehler as string) ?? undefined };
}

/**
 * Stiftungsrat: Antrag bewilligen – mit E-Mail (Status erst nach erfolgreichem
 * Versand) oder ohne E-Mail. Wirft nie.
 */
export async function sendeBewilligung(n: {
  antragId: string;
  betrag: number;
  mitMail: boolean;
  betreff: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; fehler: string }> {
  const { ok, daten } = await post(`/api/antraege/${n.antragId}/bewilligung`, {
    betrag: n.betrag,
    mitMail: n.mitMail,
    betreff: n.betreff,
    text: n.text,
  });
  if (ok) return { ok: true };
  return { ok: false, fehler: (daten.fehler as string) ?? "Die Bewilligung konnte nicht gespeichert werden." };
}
