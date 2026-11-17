import Image from "next/image";
import { FOERDERBEREICHE, SATZUNG, STAND } from "@/content/stiftung";
import { Akkordeon } from "../ui/Akkordeon";
import { Einblenden, Kicker } from "../ui/Diverses";

export function Stiftungszweck() {
  return (
    <section id="zweck" aria-labelledby="zweck-titel" className="section bg-neutral-300/20">
      <div className="container-site">
        <Einblenden className="grid gap-6 lg:grid-cols-2 lg:gap-16 lg:items-end mb-14">
          <div>
            <Kicker>Stiftungszweck</Kicker>
            <h2 id="zweck-titel" className="text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125]">
              Wofür sich die Stiftung einsetzt
            </h2>
          </div>
          <p className="text-lg leading-[1.556] max-w-[60ch]">
            Zweck der Stiftung ist die Förderung kirchlicher, kultureller – insbesondere künstlerischer – Zwecke, der Bildung
            und Hilfe für notleidende Menschen. Sie verfolgt ausschließlich und unmittelbar gemeinnützige und mildtätige Zwecke.
          </p>
        </Einblenden>

        <ul className="grid gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {FOERDERBEREICHE.map((b, i) => (
            <li key={b.titel}>
              <Einblenden verzoegerung={i * 0.08} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-300">
                  <Image
                    src={b.bild}
                    alt={b.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-8 mb-2 text-2xl leading-[1.333]">{b.titel}</h3>
                <p className="text-base">{b.text}</p>
              </Einblenden>
            </li>
          ))}
        </ul>

        <Einblenden className="mt-[80px] lg:mt-[120px] grid gap-8 lg:grid-cols-[4fr_8fr] lg:gap-16">
          <div>
            <h3 className="text-[30px] leading-[1.2]">Satzung im Wortlaut</h3>
            <p className="mt-4 text-base">Auszug, §§ 1 bis 4. Stand: {STAND}.</p>
          </div>
          <Akkordeon
            ueberschriftEbene={4}
            eintraege={SATZUNG.map((p) => ({
              titel: `${p.nr} ${p.titel}`,
              inhalt: (
                <div className="space-y-4">
                  {p.absaetze.map((a, i) =>
                    typeof a === "string" ? (
                      <p key={i}>{a}</p>
                    ) : (
                      <div key={i}>
                        <p>{a.text}</p>
                        <ul className="mt-3 space-y-2 list-disc pl-5">
                          {a.liste.map((l) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                </div>
              ),
            }))}
          />
        </Einblenden>
      </div>
    </section>
  );
}
