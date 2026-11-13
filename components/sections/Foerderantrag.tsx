import Image from "next/image";
import { ABLAUF, FOERDERVORAUSSETZUNGEN } from "@/content/foerderantrag";
import { ButtonLink } from "../ui/Button";
import { Einblenden, Kicker } from "../ui/Diverses";

export function Foerderantrag() {
  return (
    <section id="foerderantrag" aria-labelledby="antrag-titel" className="section">
      <div className="container-site">
        <div className="max-w-3xl mb-14">
          <Kicker>Förderantrag</Kicker>
          <h2 id="antrag-titel" className="text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125]">
            In vier Schritten zur Förderung
          </h2>
          <p className="mt-6 text-lg leading-[1.556]">
            Anträge stellen Sie vollständig online. Sie brauchen dafür ein Konto, die Angaben zu Ihrem Vorhaben und die
            Nachweise Ihrer Gemeinnützigkeit.
          </p>
        </div>

        <ol className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 border-t border-neutral-400">
          {ABLAUF.map((s, i) => (
            <li key={s.nr} className="pt-8">
              <Einblenden verzoegerung={i * 0.08}>
                <span aria-hidden="true" className="block font-display font-extralight text-[60px] leading-none text-neutral-800">
                  {s.nr}
                </span>
                <h3 className="mt-6 mb-3 text-2xl leading-[1.333]">
                  <span className="sr-only">Schritt {i + 1}: </span>
                  {s.titel}
                </h3>
                <p className="text-base">{s.text}</p>
              </Einblenden>
            </li>
          ))}
        </ol>

        <div className="mt-[80px] lg:mt-[120px] grid bg-neutral-800 lg:grid-cols-2">
          <div className="relative min-h-[280px] lg:min-h-[520px]">
            <Image
              src="/bilder/abendrot.jpg"
              alt="Abendrot über dem Alpenvorland, im Vordergrund die Silhouette eines Baumes"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="px-6 py-14 md:px-14 lg:px-16 lg:py-20 flex flex-col justify-center">
            <h3 className="text-neutral-100 text-[30px] leading-[1.2] lg:text-[36px] lg:leading-[1.111]">
              Voraussetzungen für einen Antrag
            </h3>
            <ul className="mt-8 space-y-4">
              {FOERDERVORAUSSETZUNGEN.map((v) => (
                <li key={v} className="flex gap-4 text-neutral-200 text-base leading-relaxed">
                  <span aria-hidden="true" className="mt-[11px] h-px w-6 shrink-0 bg-abendrot" />
                  {v}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href="/antrag" variante="aufDunkelVoll" gross>
                Antrag stellen
              </ButtonLink>
              <ButtonLink href="/registrieren" variante="aufDunkel" gross>
                Konto anlegen
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
