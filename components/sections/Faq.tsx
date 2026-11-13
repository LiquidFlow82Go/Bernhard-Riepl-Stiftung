import { FAQ } from "@/content/faq";
import { Akkordeon } from "../ui/Akkordeon";
import { Kicker, MitPlatzhaltern } from "../ui/Diverses";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-titel" className="section bg-neutral-300/20">
      <div className="container-site grid gap-10 lg:grid-cols-[4fr_8fr] lg:gap-16">
        <div>
          <Kicker>Fragen und Antworten</Kicker>
          <h2 id="faq-titel" className="text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125]">
            Gut zu wissen
          </h2>
          <p className="mt-6 text-lg leading-[1.556]">Die häufigsten Fragen rund um den Förderantrag.</p>
        </div>
        <Akkordeon
          eintraege={FAQ.map((f) => ({
            titel: f.frage,
            inhalt: (
              <p>
                <MitPlatzhaltern text={f.antwort} />
              </p>
            ),
          }))}
        />
      </div>
    </section>
  );
}
