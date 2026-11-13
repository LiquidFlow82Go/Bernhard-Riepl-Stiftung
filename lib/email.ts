/**
 * E-Mail-Versand.
 * Phase 1: kein Versand, nur Protokoll in der Konsole.
 * Phase 4: Route Handler (app/api/absage/route.ts) mit nodemailer über das
 * Stiftungspostfach (SMTP_* aus .env). Die Komponente ruft weiterhin nur
 * sendeAbsage() auf.
 */
export interface EmailNachricht {
  an: string;
  betreff: string;
  text: string;
  antragId: string;
}

export interface VersandErgebnis {
  ok: boolean;
  simuliert: boolean;
  fehler?: string;
}

export async function sendeAbsage(n: EmailNachricht): Promise<VersandErgebnis> {
  await new Promise((r) => setTimeout(r, 300));
  if (process.env.NODE_ENV !== "production") {
    console.info("[Phase 1] Absage nicht versendet (Simulation):", n);
  }
  return { ok: true, simuliert: true };
}

/** Eingangsbestätigung an Antragsteller und Benachrichtigung an den Stiftungsrat (Phase 4). */
export async function sendeEingangsbestaetigung(_an: string, _antragsnummer: string): Promise<VersandErgebnis> {
  return { ok: true, simuliert: true };
}
