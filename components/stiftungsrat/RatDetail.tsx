"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ABSAGE_VORLAGEN, type AbsageVorlage } from "@/content/absageVorlagen";
import { aendereStatus, ladeAntrag, markiereUnterlagenGesehen, neueUnterlagenSeit } from "@/lib/antraege";
import { betrag, formatBetrag, formatEuro, normalisiereBetrag, parseBetrag } from "@/lib/betrag";
import { datumDe } from "@/lib/format";
import { STATUS_LABEL, type Antrag, type AntragStatus } from "@/lib/types";
import { AntragAnsicht } from "../antrag/AntragAnsicht";
import { ansichtDokumente, PdfButton, Zurueck } from "../konto/Gemeinsam";
import { Button } from "../ui/Button";
import { Hinweisbox, Laden, StatusBadge } from "../ui/Diverses";
import { Fehlertext } from "../ui/Feld";
import { AbsageDialog } from "./AbsageDialog";
import { MailStatus } from "./MailStatus";

export function RatDetail() {
  const { id } = useParams<{ id: string }>();
  const [antrag, setAntrag] = useState<Antrag | null | undefined>(undefined);
  const [status, setStatus] = useState<AntragStatus>("eingegangen");
  const [bewilligt, setBewilligt] = useState("");
  const [meldung, setMeldung] = useState<string>("");
  const [fehler, setFehler] = useState<string | undefined>();
  const [vorlage, setVorlage] = useState<AbsageVorlage | null>(null);
  const [mailStand, setMailStand] = useState(0);

  useEffect(() => {
    ladeAntrag(id).catch(() => null).then((a) => {
      setAntrag(a);
      if (a) {
        setStatus(a.status);
        setBewilligt(a.bewilligterBetrag != null ? formatBetrag(a.bewilligterBetrag) : "");
      }
    });
  }, [id]);

  if (antrag === undefined) return <Laden />;
  if (antrag === null)
    return (
      <div className="container-site py-20">
        <Zurueck href="/stiftungsrat">Alle Anträge</Zurueck>
        <h1 className="mt-6 text-4xl">Antrag nicht gefunden</h1>
      </div>
    );

  async function speichern() {
    if (!antrag) return;
    setMeldung("");
    const p = parseBetrag(bewilligt);
    if (!p.ok) {
      setFehler("Bitte nur Ziffern, Punkt und Komma verwenden, z. B. 4.000,00.");
      document.getElementById("rat-bewilligt")?.focus();
      return;
    }
    if (status === "bewilligt" && (p.leer || p.n <= 0)) {
      setFehler("Bitte geben Sie für eine Bewilligung den bewilligten Betrag an.");
      document.getElementById("rat-bewilligt")?.focus();
      return;
    }
    if (status === "abgelehnt" && antrag.status !== "abgelehnt") {
      setStatus(antrag.status);
      setFehler(undefined);
      setMeldung("Für eine Ablehnung wählen Sie bitte unten einen Ausschlussgrund. Damit wird die Absage vorbereitet.");
      document.getElementById("absage-titel")?.scrollIntoView({ block: "start" });
      return;
    }
    setFehler(undefined);
    let neu: Antrag;
    try {
      neu = await aendereStatus(antrag.id, status, p.leer ? null : p.n);
    } catch {
      setMeldung("Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.");
      return;
    }
    setAntrag(neu);
    setMeldung(`Gespeichert: Status „${STATUS_LABEL[neu.status]}“${neu.bewilligterBetrag != null ? `, bewilligt ${formatEuro(neu.bewilligterBetrag)}` : ""}.`);
  }

  const A = antrag.daten.antragsteller;
  const neueSeit = neueUnterlagenSeit(antrag);

  async function gesehen() {
    if (!antrag) return;
    try {
      await markiereUnterlagenGesehen(antrag.id);
      const neu = await ladeAntrag(antrag.id);
      if (neu) setAntrag(neu);
      setMeldung("Nachgereichte Unterlagen als gesehen markiert.");
    } catch {
      setMeldung("Konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.");
    }
  }

  return (
    <div className="container-site py-12 lg:py-20">
      <Zurueck href="/stiftungsrat">Alle Anträge</Zurueck>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <p className="caps text-sm text-neutral-700 mb-3 tabular-nums">Antrag {antrag.nummer} · {A.name}</p>
          <h1 className="text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125]">{antrag.daten.projekt.titel}</h1>
        </div>
        <PdfButton antrag={antrag} variante="sekundaer" />
      </div>

      <div className="mt-12 grid gap-12 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-16 items-start">
        <div className="min-w-0 order-2 xl:order-1">
          <h2 className="mb-8 text-[30px] leading-[1.2]">Angaben im Antrag</h2>
          <AntragAnsicht
            daten={antrag.daten}
            bewilligt={antrag.bewilligterBetrag}
            dokumente={ansichtDokumente(antrag.dokumente)}
          />
        </div>

        <aside className="order-1 xl:order-2 xl:sticky xl:top-28 grid gap-8" aria-label="Bearbeitung">
          {neueSeit && (
            <Hinweisbox art="warn">
              <p className="font-medium">Neue Unterlagen seit {datumDe(neueSeit, true)}</p>
              <p className="mt-1 text-sm">Der Antragsteller hat Dokumente nachgereicht. Sie sind unter „5 Dokumente“ mit „nachgereicht“ gekennzeichnet.</p>
              <button type="button" onClick={gesehen} className="mt-2 min-h-11 text-sm underline underline-offset-4 text-neutral-800 cursor-pointer">
                Als gesehen markieren
              </button>
            </Hinweisbox>
          )}
          <section aria-labelledby="status-titel" className="bg-neutral-100 border border-neutral-400 shadow-card p-6">
            <h2 id="status-titel" className="text-2xl leading-snug">Entscheidung</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-700">Aktueller Status</dt>
                <dd className="mt-1.5"><StatusBadge status={antrag.status} /></dd>
              </div>
              <div>
                <dt className="text-neutral-700">Beantragt</dt>
                <dd className="mt-1 text-neutral-800 text-base tabular-nums">{formatEuro(betrag(antrag.daten.finanzierung.stiftung))}</dd>
              </div>
              <div>
                <dt className="text-neutral-700">Eingang</dt>
                <dd className="mt-1 text-neutral-800 text-base">{datumDe(antrag.eingereichtAm)}</dd>
              </div>
              <div>
                <dt className="text-neutral-700">Geändert</dt>
                <dd className="mt-1 text-neutral-800 text-base">{datumDe(antrag.aktualisiertAm)}</dd>
              </div>
            </dl>

            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-neutral-800">Status setzen</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(Object.keys(STATUS_LABEL) as AntragStatus[]).map((s) => (
                  <label key={s} className={`flex items-center gap-2.5 cursor-pointer border px-3 py-2.5 ${status === s ? "border-neutral-800 bg-neutral-200" : "border-neutral-400"}`}>
                    <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="size-4 accent-neutral-800" />
                    <span className="text-sm text-neutral-800">{STATUS_LABEL[s]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 flex flex-col gap-2">
              <label htmlFor="rat-bewilligt" className="text-sm font-medium text-neutral-800">Bewilligter Betrag</label>
              <div className="relative">
                <input
                  id="rat-bewilligt"
                  inputMode="decimal"
                  value={bewilligt}
                  onChange={(e) => setBewilligt(e.target.value)}
                  onBlur={() => setBewilligt(normalisiereBetrag(bewilligt))}
                  placeholder="0,00"
                  aria-invalid={fehler ? true : undefined}
                  aria-describedby={fehler ? "rat-bewilligt-fehler" : undefined}
                  className="w-full h-12 rounded-pill border border-neutral-700 bg-neutral-100 pl-[18px] pr-10 text-right tabular-nums text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut aria-[invalid=true]:border-fehler aria-[invalid=true]:border-2"
                />
                <span aria-hidden="true" className="absolute right-[18px] top-1/2 -translate-y-1/2 text-neutral-700">€</span>
              </div>
              <Fehlertext id="rat-bewilligt-fehler" text={fehler} />
            </div>
            <div className="mt-6">
              <Button onClick={speichern} className="w-full">Speichern</Button>
            </div>
            <p role="status" className="mt-3 text-sm text-neutral-800 min-h-5">{meldung}</p>
          </section>

          {antrag.status === "abgelehnt" && antrag.absage && (
            <Hinweisbox art="info">
              <p className="font-medium">Abgelehnt am {datumDe(antrag.absage.datum)}</p>
              <p className="mt-1 text-sm">Grund: {antrag.absage.grundTitel}</p>
              <p className="text-sm">An: {antrag.absage.empfaenger}</p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer underline underline-offset-4">Gesendeten Text anzeigen</summary>
                <p className="mt-2 font-medium">{antrag.absage.betreff}</p>
                <p className="mt-2 whitespace-pre-line">{antrag.absage.text}</p>
              </details>
            </Hinweisbox>
          )}

          <MailStatus antragId={antrag.id} aktualisierung={mailStand} />

          {antrag.status !== "abgelehnt" && (
          <section aria-labelledby="absage-titel" className="scroll-mt-28">
            <h2 id="absage-titel" className="text-2xl leading-snug">Absage mit Ausschlussgrund</h2>
            <p className="mt-2 text-sm text-neutral-700">Öffnet einen vorbereiteten, bearbeitbaren Absagetext.</p>
            <ul className="mt-4 grid gap-2">
              {ABSAGE_VORLAGEN.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => setVorlage(v)}
                    aria-haspopup="dialog"
                    className="w-full text-left border border-neutral-400 bg-neutral-100 px-4 py-3 cursor-pointer hover:border-neutral-800 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut"
                  >
                    <span className="block text-neutral-800 font-medium">{v.titel}</span>
                    <span className="block text-sm text-neutral-700">{v.kurz}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          )}
        </aside>
      </div>

      <AbsageDialog
        antrag={antrag}
        vorlage={vorlage}
        onSchliessen={() => setVorlage(null)}
        onGesendet={(neu) => {
          setVorlage(null);
          setAntrag(neu);
          setStatus(neu.status);
          setMailStand((n) => n + 1);
          setMeldung(`Absage versendet: Status „Abgelehnt“ (${neu.absage?.grundTitel}).`);
        }}
      />
    </div>
  );
}
