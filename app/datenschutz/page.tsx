import type { Metadata } from "next";
import { RechtstextSeite } from "@/components/layout/RechtstextSeite";
import { DATENSCHUTZ } from "@/content/rechtstexte";

export const metadata: Metadata = { title: "Datenschutz" };

export default function Seite() {
  return <RechtstextSeite text={DATENSCHUTZ} />;
}
