import { DieStiftung } from "@/components/sections/DieStiftung";
import { Faq } from "@/components/sections/Faq";
import { Foerderantrag } from "@/components/sections/Foerderantrag";
import { Hero } from "@/components/sections/Hero";
import { Kontakt } from "@/components/sections/Kontakt";
import { Stiftungszweck } from "@/components/sections/Stiftungszweck";

export default function Startseite() {
  return (
    <>
      <Hero />
      <DieStiftung />
      <Stiftungszweck />
      <Foerderantrag />
      <Faq />
      <Kontakt />
    </>
  );
}
