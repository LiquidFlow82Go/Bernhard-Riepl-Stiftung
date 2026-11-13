import Image from "next/image";
import { STIFTUNG, VERTRETUNG } from "@/content/stiftung";
import { ButtonLink } from "../ui/Button";
import { Einblenden, Kicker, MitPlatzhaltern } from "../ui/Diverses";

export function Kontakt() {
  const a = STIFTUNG.anschrift;
  return (
    <section id="kontakt" aria-labelledby="kontakt-titel" className="section">
      <div className="container-site grid gap-12 lg:grid-cols-[7fr_5fr] lg:gap-[96px] items-center">
        <Einblenden>
          <Kicker>Kontakt</Kicker>
          <h2 id="kontakt-titel" className="text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125]">
            Wir freuen uns auf Ihr Vorhaben
          </h2>
          <p className="mt-6 text-lg leading-[1.556] max-w-[56ch]">
            Für Fragen zur Förderung erreichen Sie die Stiftung schriftlich oder per E-Mail. Anträge stellen Sie bitte über
            das Online-Formular.
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-2">
            <div>
              <h3 className="caps text-sm text-neutral-700 font-body font-normal mb-3">Anschrift</h3>
              <address className="not-italic text-lg leading-relaxed text-neutral-800">
                {a.zeile1}
                <br />
                {a.zeile2}
                <br />
                {a.strasse}
                <br />
                {a.ort}
              </address>
            </div>
            <div>
              <h3 className="caps text-sm text-neutral-700 font-body font-normal mb-3">Telefon und E-Mail</h3>
              <p className="text-lg leading-relaxed text-neutral-800">
                <MitPlatzhaltern text={STIFTUNG.telefon} />
                <br />
                <MitPlatzhaltern text={STIFTUNG.email} />
              </p>
            </div>
          </div>
          <p className="mt-10 text-sm text-neutral-700 max-w-[60ch]">{VERTRETUNG}</p>
          <div className="mt-10">
            <ButtonLink href="/antrag" gross>
              Zum Förderantrag
            </ButtonLink>
          </div>
        </Einblenden>

        <Einblenden verzoegerung={0.1}>
          <div className="relative aspect-[3/4] max-w-[460px] mx-auto lg:ml-auto overflow-hidden bg-neutral-300">
            <Image
              src="/bilder/riepl-portrait-hut.jpg"
              alt="Bernhard Riepl mit Strohhut, lächelnd, im Sommer vor einem Haus"
              fill
              sizes="(min-width: 1024px) 35vw, 100vw"
              className="object-cover object-top"
            />
          </div>
        </Einblenden>
      </div>
    </section>
  );
}
