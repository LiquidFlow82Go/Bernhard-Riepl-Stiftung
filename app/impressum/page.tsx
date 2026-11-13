import type { Metadata } from "next";
import { RechtstextSeite } from "@/components/layout/RechtstextSeite";
import { IMPRESSUM } from "@/content/rechtstexte";

export const metadata: Metadata = { title: "Impressum" };

export default function Seite() {
  return <RechtstextSeite text={IMPRESSUM} />;
}
