import type { Metadata } from "next";
import { RechtstextSeite } from "@/components/layout/RechtstextSeite";
import { HAFTUNGSAUSSCHLUSS } from "@/content/rechtstexte";

export const metadata: Metadata = { title: "Haftungsausschluss" };

export default function Seite() {
  return <RechtstextSeite text={HAFTUNGSAUSSCHLUSS} />;
}
