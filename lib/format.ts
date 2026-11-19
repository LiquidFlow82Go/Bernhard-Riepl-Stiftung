export function datumDe(iso: string, lang = false): string {
  return new Date(iso).toLocaleDateString("de-DE", lang ? { day: "numeric", month: "long", year: "numeric" } : { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Anzeigename eines Kontos: Name aus dem Profil, sonst die E-Mail-Adresse. */
export function anzeigeName(b: { name?: string | null; email: string } | null | undefined): string {
  if (!b) return "";
  return b.name?.trim() || b.email;
}
