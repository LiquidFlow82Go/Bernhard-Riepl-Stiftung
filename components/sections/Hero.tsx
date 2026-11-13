import Image from "next/image";
import { ButtonLink } from "../ui/Button";

export function Hero() {
  return (
    <section aria-labelledby="hero-titel" className="relative isolate overflow-hidden">
      <Image
        src="/bilder/landhaus.jpg"
        alt="Landhaus der Familie Riepl bei Miesbach im Herbst, umgeben von alten Bäumen und Wiese"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_60%] -z-10"
      />
      <div className="absolute inset-0 -z-10 bg-overlay-65" aria-hidden="true" />
      <div className="container-site py-[120px] md:py-[180px] lg:py-hero">
        <div className="max-w-[760px]">
          <p className="caps text-sm text-neutral-200 mb-6">Gemeinnützige Stiftung · Miesbach · seit 2001</p>
          <h1 id="hero-titel" className="text-neutral-100 text-[44px] leading-[1.1] sm:text-[56px] lg:text-[76px] lg:leading-[1.131]">
            Fördern, was eine Gemeinschaft trägt
          </h1>
          <p className="mt-6 max-w-[560px] text-lg leading-[1.556] text-neutral-200">
            Die Bernhard Riepl Stiftung unterstützt kirchliche und kulturelle – insbesondere künstlerische – Vorhaben, die
            Bildung und Menschen in Not.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href="/antrag" variante="aufDunkelVoll" gross>
              Förderantrag stellen
            </ButtonLink>
            <ButtonLink href="/#stiftung" variante="aufDunkel" gross>
              Mehr über die Stiftung
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
