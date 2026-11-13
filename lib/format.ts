export function datumDe(iso: string, lang = false): string {
  return new Date(iso).toLocaleDateString("de-DE", lang ? { day: "numeric", month: "long", year: "numeric" } : { day: "2-digit", month: "2-digit", year: "numeric" });
}
