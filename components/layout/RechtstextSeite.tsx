import type { RechtsAbschnitt, Rechtstext } from "@/content/rechtstexte";
import { MitPlatzhaltern } from "../ui/Diverses";

function Abschnitt({ a, tiefe }: { a: RechtsAbschnitt; tiefe: number }) {
  const H = tiefe === 0 ? "h2" : "h3";
  return (
    <section>
      {a.titel && <H>{a.titel}</H>}
      {a.absaetze?.map((p, i) => (
        <p key={i}>
          <MitPlatzhaltern text={p} />
        </p>
      ))}
      {a.liste && (
        <ul>
          {a.liste.map((l) => (
            <li key={l}>
              <MitPlatzhaltern text={l} />
            </li>
          ))}
        </ul>
      )}
      {a.unter?.map((u, i) => <Abschnitt key={i} a={u} tiefe={tiefe + 1} />)}
    </section>
  );
}

export function RechtstextSeite({ text }: { text: Rechtstext }) {
  const hatPlatzhalter = JSON.stringify(text).includes("[");
  return (
    <article className="container-site py-16 lg:py-[120px]">
      <div className="max-w-[820px]">
        <p className="caps text-sm text-neutral-700 mb-4">Rechtliches</p>
        <h1 className="text-[44px] leading-[1.1] lg:text-[60px] lg:leading-none">{text.titel}</h1>
        <p className="mt-6 text-sm text-neutral-700">Stand: {text.stand}</p>
        {hatPlatzhalter && (
          <p className="mt-6 border-l-4 border-herbstgold bg-[#e0a21a1f] px-5 py-4 text-neutral-800">
            Entwurf: Markierte Angaben in eckigen Klammern sind noch zu ergänzen und vor der Veröffentlichung rechtlich zu prüfen.
          </p>
        )}
        <div className="prose-recht mt-10 text-base leading-relaxed">
          {text.einleitung && <p className="text-lg">{text.einleitung}</p>}
          {text.abschnitte.map((a, i) => (
            <Abschnitt key={i} a={a} tiefe={0} />
          ))}
        </div>
      </div>
    </article>
  );
}
