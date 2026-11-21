import { redirect } from "next/navigation";

/** Einstieg in den Bereich des Stiftungsvorstands: Eingegangene Anträge. */
export default async function Seite({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === "string") p.set(k, v);
  redirect(`/stiftungsvorstand/antraege${p.size ? `?${p}` : ""}`);
}
