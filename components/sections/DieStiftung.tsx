import Image from "next/image";
import { ECKDATEN, PRAEAMBEL } from "@/content/stiftung";
import { Einblenden, Kicker } from "../ui/Diverses";

export function DieStiftung() {
  return (
    <section id="stiftung" aria-labelledby="stiftung-titel" className="section">
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-[96px] items-start">
          <Einblenden>
            <figure>
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-300">
                <Image
                  src="/bilder/riepl-portrait.jpg"
                  alt="Porträt von Bernhard Riepl in Trachtenjanker vor einem historischen Gebäude"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="mt-4 text-sm text-neutral-700">Bernhard Riepl, Stifter</figcaption>
            </figure>
          </Einblenden>

          <Einblenden verzoegerung={0.1}>
            <Kicker>Die Stiftung</Kicker>
            <h2 id="stiftung-titel" className="text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125]">
              Eine Familientradition, auf Dauer angelegt
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-[1.556] max-w-[64ch]">
              {PRAEAMBEL.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="mt-4 text-sm text-neutral-700">Aus der Präambel der Satzung</p>

            <h3 className="mt-16 text-2xl leading-snug">Auf einen Blick</h3>
            <dl className="mt-6 border-t border-neutral-400">
              {ECKDATEN.map((e) => (
                <div key={e.label} className="grid sm:grid-cols-[220px_1fr] gap-1 sm:gap-6 py-4 border-b border-neutral-400">
                  <dt className="caps text-sm text-neutral-700">{e.label}</dt>
                  <dd className="text-neutral-800">{e.wert}</dd>
                </div>
              ))}
            </dl>
          </Einblenden>
        </div>
      </div>
    </section>
  );
}
