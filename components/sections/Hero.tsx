import Image from "next/image";
import { ButtonLink } from "../ui/Button";

/**
 * Hero Variante A: randloses Bild über die ganze Bildschirmhöhe, die
 * Navigation schwebt darüber. Ein Verlauf dunkelt nur die Textseite ab.
 * Beim Laden blenden Bild und Text weich ein (entfällt bei „Bewegung reduzieren“).
 */
export function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-titel" className="relative isolate overflow-hidden bg-neutral-800 min-h-[640px] h-[100svh] max-h-[1080px] flex">
      <Image
        src="/bilder/landhaus.jpg"
        alt="Landhaus der Familie Riepl bei Miesbach im Herbst, umgeben von alten Bäumen und Wiese"
        fill
        priority
        sizes="100vw"
        className="hero-bild object-cover object-[38%_50%] lg:object-[50%_55%] -z-10"
      />
      {/* Smartphone/Tablet: Verlauf von unten */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 lg:hidden"
        style={{ background: "linear-gradient(0deg, rgba(15,11,8,0.88) 0%, rgba(15,11,8,0.62) 45%, rgba(15,11,8,0.2) 75%, rgba(15,11,8,0.45) 100%)" }}
      />
      {/* Desktop: Verlauf von der Textseite */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden lg:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(15,11,8,0.77) 0%, rgba(15,11,8,0.39) 55%, rgba(15,11,8,0.05) 100%), linear-gradient(0deg, rgba(15,11,8,0.55) 0%, rgba(15,11,8,0) 45%)",
        }}
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[200px] -z-10" style={{ background: "linear-gradient(180deg, rgba(15,11,8,0.45) 0%, rgba(15,11,8,0) 100%)" }} />

      <div className="w-full flex items-center px-6 pt-[120px] pb-[64px] lg:pt-[140px] lg:pb-[104px]">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-5 lg:gap-6">
          <p className="hero-ein caps text-[13px] lg:text-sm text-neutral-200" style={{ animationDelay: "0.15s" }}>
            Gemeinnützige Stiftung · Miesbach · seit 2001
          </p>
          <h1
            id="hero-titel"
            className="hero-ein text-neutral-100 max-w-[820px] text-[44px] leading-[1.08] sm:text-[60px] lg:text-[84px] lg:leading-[1.07]"
            style={{ animationDelay: "0.3s" }}
          >
            Fördern, was eine Gemeinschaft trägt
          </h1>
          <p className="hero-ein max-w-[560px] text-[17px] lg:text-lg leading-[1.556] text-neutral-200" style={{ animationDelay: "0.45s" }}>
            Die Bernhard Riepl Stiftung fördert kirchliche, kulturelle und künstlerische Vorhaben, unterstützt
            Bildungsinitiativen und stärkt Institutionen, die Menschen in Not beistehen.
          </p>
          <div className="hero-ein mt-2 lg:mt-3 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4" style={{ animationDelay: "0.6s" }}>
            <ButtonLink href="/antrag" variante="aufDunkelVoll" gross className="!border-transparent">
              Förderantrag stellen
            </ButtonLink>
            <ButtonLink href="/#stiftung" variante="aufDunkel" gross className="!border-white/80">
              Mehr über die Stiftung
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
