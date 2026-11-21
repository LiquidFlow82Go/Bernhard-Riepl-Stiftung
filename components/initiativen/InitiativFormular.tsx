"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { normalisiereBetrag } from "@/lib/betrag";
import { ladeBlobHerunter } from "@/lib/dokumente";
import { ladeInitiative, legeInitiativeAn, speichereInitiative } from "@/lib/initiativen";
import { initiativFeldId, istInitiativPflicht, pruefeInitiative, regelLabel, regelSchritt, wertAn, type InitiativFehler } from "@/lib/initiativeSchema";
import {
  BELEG_ANGEBOT_TEXT,
  BELEG_RECHNUNG_TEXT,
  SATZUNGSZWECKE,
  VERFLECHTUNG_TEXT,
  leereInitiative,
  type InitiativDaten,
  type Initiative,
} from "@/lib/initiativeTypen";
import { useAuth } from "../auth/AuthProvider";
import { setzeAnPfad } from "../antrag/AntragKontext";
import { Button, ButtonLink } from "../ui/Button";
import { Hinweisbox } from "../ui/Diverses";
import { Checkbox, Fehlertext, Textbereich, Textfeld } from "../ui/Feld";
import { InitiativeKennzeichen } from "../stiftungsvorstand/Bereich";
import { InitiativAnsicht } from "./InitiativAnsicht";
import { InitiativUpload } from "./InitiativUpload";

const SCHRITTE = [
  { nr: 1, titel: "Stammdaten", lang: "Projekt-Stammdaten" },
  { nr: 2, titel: "Zweckbindung", lang: "Zweckbindung & Bedarfsbegründung" },
  { nr: 3, titel: "Finanzen", lang: "Finanzen & Mittelverwendung" },
  { nr: 4, titel: "Beschluss", lang: "Gremienbeschluss & Compliance" },
  { nr: 5, titel: "Abschluss", lang: "Abschluss & Verwendungsnachweis" },
  { nr: 6, titel: "Zusammenfassung", lang: "Zusammenfassung" },
];

function Untertitel({ children }: { children: ReactNode }) {
  return <h3 className="mt-12 first:mt-0 mb-6 text-2xl leading-snug">{children}</h3>;
}

/**
 * Formular „Neue Initiative“ bzw. Bearbeiten, mehrstufig wie der Antrag auf
 * Förderung. Entwürfe werden in der Datenbank gespeichert (beim ersten Speichern
 * wird das Aktenzeichen vergeben) und lassen sich jederzeit fortsetzen.
 */
export function InitiativFormular({ vorhanden, startSchritt = 1 }: { vorhanden?: Initiative; startSchritt?: number }) {
  const router = useRouter();
  const { benutzer } = useAuth();
  const [initiative, setInitiative] = useState<Initiative | null>(vorhanden ?? null);
  const [daten, setDaten] = useState<InitiativDaten>(() => vorhanden?.daten ?? leereInitiative(benutzer?.kuerzel ?? ""));
  const [schritt, setSchritt] = useState(Math.min(Math.max(1, startSchritt), 6));
  const [fehler, setFehler] = useState<InitiativFehler>({});
  const [zeigeUebersicht, setZeigeUebersicht] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const [speichert, setSpeichert] = useState(false);
  const [geaendert, setGeaendert] = useState(false);
  const titelRef = useRef<HTMLHeadingElement>(null);
  const uebersichtRef = useRef<HTMLDivElement>(null);
  const navigiert = useRef(false);
  const fokusNach = useRef<string | null>(null);

  // Kürzel vorbelegen, sobald das Profil geladen ist (nur bei neuen Initiativen)
  useEffect(() => {
    if (!vorhanden && benutzer?.kuerzel)
      setDaten((d) => (d.abschluss.kuerzel ? d : setzeAnPfad(d, "abschluss.kuerzel", benutzer.kuerzel)));
  }, [benutzer?.kuerzel, vorhanden]);

  // Warnung beim Verlassen mit ungespeicherten Änderungen
  useEffect(() => {
    if (!geaendert) return;
    const f = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [geaendert]);

  useEffect(() => {
    if (!navigiert.current) return;
    if (fokusNach.current) {
      const el = document.getElementById(initiativFeldId(fokusNach.current));
      fokusNach.current = null;
      if (el) {
        el.focus();
        return;
      }
    }
    titelRef.current?.focus();
    titelRef.current?.scrollIntoView({ block: "start" });
  }, [schritt]);

  const setze = useCallback((pfad: string, wert: unknown) => {
    setDaten((d) => setzeAnPfad(d, pfad, wert));
    setGeaendert(true);
    setFehler((f) => {
      if (!f[pfad]) return f;
      const n = { ...f };
      delete n[pfad];
      return n;
    });
  }, []);

  const feld = (pfad: string) => ({
    id: initiativFeldId(pfad),
    name: pfad,
    value: String(wertAn(daten, pfad) ?? ""),
    onChange: (e: { target: { value: string } }) => setze(pfad, e.target.value),
    fehler: fehler[pfad],
    pflicht: istInitiativPflicht(pfad),
  });

  async function neuLaden() {
    if (!initiative) return;
    const neu = await ladeInitiative(initiative.id).catch(() => null);
    if (neu) setInitiative({ ...neu, daten });
  }

  /** Speichert ohne Prüfung. Beim ersten Mal wird das Aktenzeichen vergeben. */
  async function speichern(meldung = true): Promise<Initiative | null> {
    setSpeichert(true);
    try {
      const neu = initiative ? await speichereInitiative(initiative.id, daten) : await legeInitiativeAn(daten);
      setInitiative(neu);
      setGeaendert(false);
      if (!initiative) window.history.replaceState(null, "", `/stiftungsvorstand/initiativen/${neu.id}/bearbeiten`);
      if (meldung)
        setHinweis(
          initiative
            ? `Entwurf gespeichert (${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr).`
            : `Initiative angelegt. Aktenzeichen: ${neu.aktenzeichen}.`,
        );
      return neu;
    } catch (e) {
      setHinweis("");
      setFehler((f) => ({ ...f, _speichern: (e as Error).message }));
      return null;
    } finally {
      setSpeichert(false);
    }
  }

  function geheZu(n: number, fokusPfad?: string) {
    navigiert.current = true;
    fokusNach.current = fokusPfad ?? null;
    setZeigeUebersicht(false);
    if (n === schritt && fokusPfad) {
      document.getElementById(initiativFeldId(fokusPfad))?.focus();
      return;
    }
    setSchritt(n);
  }

  async function weiter() {
    const f = schritt <= 5 ? pruefeInitiative(daten, { stufen: ["formular"], schritt }) : {};
    setFehler(f);
    if (Object.keys(f).length) {
      setZeigeUebersicht(true);
      requestAnimationFrame(() => uebersichtRef.current?.focus());
      return;
    }
    const ok = await speichern(false);
    if (!ok) return;
    setHinweis(`Gespeichert. Aktenzeichen ${ok.aktenzeichen}.`);
    geheZu(schritt + 1);
  }

  async function abschliessen() {
    const ok = await speichern(false);
    if (ok) {
      setGeaendert(false);
      router.push(`/stiftungsvorstand/initiativen/${ok.id}?gespeichert=1`);
    }
  }

  async function pdfVorschau() {
    const m = await import("@/lib/pdfInitiative");
    const blob = await m.erzeugeInitiativPdf({ daten, aktenzeichen: initiative?.aktenzeichen });
    ladeBlobHerunter(blob, m.initiativPdfDateiname(initiative?.aktenzeichen ?? "Entwurf", daten.stammdaten.titel));
  }

  const fehlerListe = Object.entries(fehler).filter(([k]) => k !== "_speichern");
  const aktuell = SCHRITTE[schritt - 1];
  const abgeschlossen = initiative?.status === "abgeschlossen";

  return (
    <div className="container-site pt-8 pb-12 lg:pt-12 lg:pb-20">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <p className="caps text-sm text-neutral-700 tabular-nums">
          {initiative ? `Initiative ${initiative.aktenzeichen}` : "Neue Initiative"}
        </p>
        <InitiativeKennzeichen />
      </div>
      <h1 className="text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125] mb-10">
        {initiative ? daten.stammdaten.titel || "Initiative bearbeiten" : "Neue Initiative anlegen"}
      </h1>

      {abgeschlossen && (
        <div className="mb-8">
          <Hinweisbox art="info">Diese Initiative ist abgeschlossen. Änderungen werden im Verlauf festgehalten; Dateien lassen sich nicht mehr hochladen.</Hinweisbox>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Schritte der Initiative" className="lg:sticky lg:top-28 lg:self-start">
          <ol className="flex lg:flex-col justify-between lg:justify-start gap-1 pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-l border-[#c98a4b]/50">
            {SCHRITTE.map((s) => {
              const aktiv = s.nr === schritt;
              return (
                <li key={s.nr} className="lg:shrink-0">
                  <button
                    type="button"
                    onClick={() => geheZu(s.nr)}
                    aria-current={aktiv ? "step" : undefined}
                    className={`flex items-center justify-center lg:justify-start gap-3 min-h-11 min-w-11 lg:py-2.5 lg:px-3 lg:pl-5 text-left cursor-pointer whitespace-nowrap lg:-ml-px lg:border-l-2 ${aktiv ? "lg:border-[#8a3f0c] text-neutral-800" : "lg:border-transparent text-neutral-700 hover:text-neutral-800"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`grid place-items-center size-9 lg:size-7 rounded-pill text-sm lg:text-xs tabular-nums ${aktiv ? "bg-[#8a3f0c] text-neutral-100" : "border border-neutral-700 bg-neutral-100"}`}
                    >
                      {s.nr}
                    </span>
                    <span className={`sr-only lg:not-sr-only ${aktiv ? "font-medium" : ""}`}>
                      <span className="sr-only">Schritt {s.nr}: </span>
                      {s.titel}
                      {s.nr === 5 && <span className="block text-xs text-neutral-700 font-normal">nach der Auszahlung</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="hidden lg:block mt-8 text-sm text-neutral-700">
            Entwürfe werden für den ganzen Vorstand gespeichert und lassen sich jederzeit fortsetzen.
          </p>
        </nav>

        <div className="min-w-0">
          <p role="status" className="text-sm text-neutral-700 min-h-5 mb-2">{hinweis}</p>
          {fehler._speichern && (
            <div role="alert" className="mb-8 border-l-4 border-fehler bg-[#b3361a12] px-5 py-4 text-neutral-800">
              {fehler._speichern}
            </div>
          )}

          {zeigeUebersicht && fehlerListe.length > 0 && (
            <div ref={uebersichtRef} tabIndex={-1} role="alert" aria-labelledby="if-fehler-titel" className="mb-10 border-2 border-fehler bg-[#b3361a0d] p-6 focus:outline-2 focus:outline-offset-2 focus:outline-eisenhut">
              <h2 id="if-fehler-titel" className="text-2xl leading-snug text-neutral-800">
                {fehlerListe.length === 1 ? "Bitte ergänzen Sie eine Angabe" : `Bitte ergänzen Sie ${fehlerListe.length} Angaben`}
              </h2>
              <ul className="mt-4 grid gap-2">
                {fehlerListe.map(([pfad, text]) => (
                  <li key={pfad}>
                    <a
                      href={`#${initiativFeldId(pfad)}`}
                      onClick={(e) => { e.preventDefault(); geheZu(regelSchritt(pfad), pfad); }}
                      className="text-fehler underline underline-offset-4"
                    >
                      {regelSchritt(pfad) !== schritt && <span>Schritt {regelSchritt(pfad)}, {regelLabel(pfad)}: </span>}
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="caps text-sm text-neutral-700">Schritt {schritt} von 6</p>
          <h2 ref={titelRef} tabIndex={-1} className="mt-2 mb-10 text-[30px] leading-[1.2] lg:text-[40px] lg:leading-[1.15] focus:outline-none">
            {aktuell.lang}
          </h2>

          <form noValidate onSubmit={(e) => { e.preventDefault(); if (schritt === 6) abschliessen(); else weiter(); }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={schritt} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                {schritt === 1 && (
                  <div className="grid gap-6 max-w-[760px]">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <p className="text-sm leading-5 text-neutral-800 font-medium">Aktenzeichen</p>
                        <p className="h-12 flex items-center rounded-pill border border-neutral-400 bg-neutral-100/60 px-[18px] tabular-nums text-neutral-800">
                          {initiative?.aktenzeichen ?? <span className="text-neutral-700 italic">wird beim ersten Speichern vergeben</span>}
                        </p>
                      </div>
                      <Textfeld {...feld("stammdaten.datum")} label="Datum" type="date" />
                    </div>
                    <Textbereich {...feld("stammdaten.titel")} label="Projekttitel" rows={2} />
                    <fieldset className="grid gap-6 min-w-0">
                      <legend className="text-xl font-display mb-4">Durchführungspartner</legend>
                      <Textfeld {...feld("stammdaten.partnerName")} label="Name der Institution" hinweis="Die Institution, die gefördert wird." autoComplete="off" />
                      <Textfeld {...feld("stammdaten.partnerTraeger")} label="Träger bzw. Rechtsform" placeholder="z. B. Bayerisches Rotes Kreuz – Körperschaft des öffentlichen Rechts" />
                      <div className="grid gap-6 sm:grid-cols-2">
                        <Textfeld {...feld("stammdaten.ansprechperson")} label="Ansprechperson" autoComplete="off" />
                        <Textfeld {...feld("stammdaten.telefon")} label="Telefon" type="tel" autoComplete="off" />
                      </div>
                      <Textfeld {...feld("stammdaten.email")} label="E-Mail" type="email" autoComplete="off" />
                      <Textbereich {...feld("stammdaten.anschrift")} label="Anschrift" rows={2} />
                    </fieldset>
                    <Textbereich {...feld("stammdaten.art")} label="Art der Initiative" rows={3} />
                  </div>
                )}

                {schritt === 2 && (
                  <div className="grid gap-8 max-w-[760px]">
                    <fieldset
                      className="min-w-0"
                      aria-describedby={fehler["zweck.bereiche"] ? `${initiativFeldId("zweck.bereiche")}-fehler` : undefined}
                    >
                      <legend className="text-base font-medium text-neutral-800">
                        Bezug zum Stiftungszweck nach § 2 der Satzung
                        <span aria-hidden="true" className="text-fehler"> *</span>
                        <span className="sr-only"> (Pflichtfeld, mindestens ein Bereich)</span>
                      </legend>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {SATZUNGSZWECKE.map((z, i) => (
                          <label key={z.id} className="flex items-start gap-3 rounded-[16px] border border-[#e4c9a5] bg-neutral-100 px-4 py-3 cursor-pointer min-h-12">
                            <input
                              type="checkbox"
                              id={i === 0 ? initiativFeldId("zweck.bereiche") : undefined}
                              checked={daten.zweck.bereiche.includes(z.id)}
                              onChange={(e) =>
                                setze(
                                  "zweck.bereiche",
                                  e.target.checked ? [...daten.zweck.bereiche, z.id] : daten.zweck.bereiche.filter((b) => b !== z.id),
                                )
                              }
                              className="mt-0.5 size-6 shrink-0 accent-neutral-800 cursor-pointer"
                            />
                            <span className="text-neutral-800">{z.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-2">
                        <Fehlertext id={`${initiativFeldId("zweck.bereiche")}-fehler`} text={fehler["zweck.bereiche"]} />
                      </div>
                    </fieldset>
                    <Textbereich {...feld("zweck.begruendung")} label="Begründung des Bezugs zum Stiftungszweck" rows={3} />
                    <Textbereich {...feld("zweck.ausgangslage")} label="Ausgangslage & Zielsetzung" hinweis="Welcher Bedarf besteht vor Ort, und was soll mit der Förderung erreicht werden?" rows={5} />
                  </div>
                )}

                {schritt === 3 && (
                  <div className="grid gap-6 max-w-[760px]">
                    <Textbereich {...feld("finanzen.gegenstand")} label="Fördergegenstand" rows={2} />
                    <div className="grid gap-6 sm:grid-cols-2">
                      <BetragEingabe
                        {...feld("finanzen.betrag")}
                        label="Förderbetrag"
                        onBlur={() => setze("finanzen.betrag", normalisiereBetrag(daten.finanzen.betrag))}
                      />
                      <Textfeld {...feld("finanzen.angebotVom")} label="Kostenvoranschlag / Angebot vom" type="date" />
                    </div>
                    <InitiativUpload initiative={initiative} kategorie="angebot" hinweis="Das Angebot bzw. den Kostenvoranschlag als Grundlage des Förderbetrags." onGeaendert={neuLaden} onErstSpeichern={() => speichern()} />
                    <Textbereich {...feld("finanzen.auszahlung")} label="Auszahlungsmodalität" rows={3} />
                  </div>
                )}

                {schritt === 4 && (
                  <div className="grid gap-6 max-w-[760px]">
                    <p className="text-sm text-neutral-700">Felder mit „für den Beschluss nötig“ müssen ausgefüllt sein, bevor der Status auf „Beschlossen“ gesetzt werden kann.</p>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Textfeld {...feld("beschluss.datum")} label="Beschluss vom" hinweis="für den Beschluss nötig" type="date" />
                      <Textfeld {...feld("beschluss.protokoll")} label="Protokoll / TOP" placeholder="z. B. Protokoll 4/2026, TOP 3" />
                    </div>
                    <Textbereich {...feld("beschluss.gemeinnuetzigkeit")} label="Gemeinnützigkeit des Partners" hinweis="für den Beschluss nötig – z. B. wie und wodurch die Gemeinnützigkeit anerkannt ist" rows={3} />
                    <InitiativUpload initiative={initiative} kategorie="gemeinnuetzigkeit" hinweis="Freistellungsbescheid o. Ä." onGeaendert={neuLaden} onErstSpeichern={() => speichern()} />
                    <div className="rounded-[22px] border border-[#e4c9a5] bg-neutral-100/80 p-5 grid gap-4">
                      <Checkbox
                        id={initiativFeldId("beschluss.keineVerflechtung")}
                        checked={daten.beschluss.keineVerflechtung}
                        onChange={(v) => setze("beschluss.keineVerflechtung", v)}
                        pflicht
                      >
                        {VERFLECHTUNG_TEXT}
                      </Checkbox>
                      {!daten.beschluss.keineVerflechtung && (
                        <Textbereich
                          {...feld("beschluss.verflechtungText")}
                          pflicht
                          label="Erläuterung der Verflechtung"
                          hinweis="Pflicht, wenn das Kästchen nicht angekreuzt ist."
                          rows={3}
                        />
                      )}
                    </div>
                  </div>
                )}

                {schritt === 5 && (
                  <div className="grid gap-6 max-w-[760px]">
                    <Hinweisbox art="info">
                      Dieser Schritt wird erst nach der Auszahlung ausgefüllt und ist beim Anlegen optional. Für den Status
                      „Abgeschlossen“ müssen beide Belegprüfungen bestätigt und der Abschlussvermerk ausgefüllt sein.
                    </Hinweisbox>
                    <div className="grid gap-4 rounded-[22px] border border-[#e4c9a5] bg-neutral-100/80 p-5">
                      <Checkbox id={initiativFeldId("abschluss.belegAngebot")} checked={daten.abschluss.belegAngebot} onChange={(v) => setze("abschluss.belegAngebot", v)}>
                        {BELEG_ANGEBOT_TEXT}
                      </Checkbox>
                      <InitiativUpload initiative={initiative} kategorie="beleg_angebot" onGeaendert={neuLaden} onErstSpeichern={() => speichern()} />
                    </div>
                    <div className="grid gap-4 rounded-[22px] border border-[#e4c9a5] bg-neutral-100/80 p-5">
                      <Checkbox id={initiativFeldId("abschluss.belegRechnung")} checked={daten.abschluss.belegRechnung} onChange={(v) => setze("abschluss.belegRechnung", v)}>
                        {BELEG_RECHNUNG_TEXT}
                      </Checkbox>
                      <InitiativUpload initiative={initiative} kategorie="beleg_rechnung" onGeaendert={neuLaden} onErstSpeichern={() => speichern()} />
                    </div>
                    <fieldset className="grid gap-6 sm:grid-cols-2 min-w-0">
                      <legend className="text-xl font-display mb-4">Abschlussvermerk: zweckentsprechende Mittelverwendung</legend>
                      <Textfeld {...feld("abschluss.geprueftAm")} label="Geprüft am" type="date" />
                      <Textfeld {...feld("abschluss.kuerzel")} label="Kürzel" hinweis={benutzer?.kuerzel ? `Ihr Kürzel: ${benutzer.kuerzel}` : undefined} autoComplete="off" />
                    </fieldset>
                  </div>
                )}

                {schritt === 6 && (
                  <div>
                    <p className="text-lg max-w-[70ch] mb-10">
                      Bitte prüfen Sie die Angaben. Den Status (Beschlossen, Ausgezahlt, Abgeschlossen) setzen Sie anschließend in der
                      Detailansicht der Initiative.
                    </p>
                    <InitiativAnsicht daten={daten} aktenzeichen={initiative?.aktenzeichen} dokumente={initiative?.dokumente ?? []} onBearbeiten={geheZu} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="aktionsleiste sticky bottom-0 z-20 -mx-6 mt-10 px-6 pt-3 bg-[#fbf2e4]/95 backdrop-blur-sm border-t border-[#e4c9a5] lg:static lg:mx-0 lg:mt-16 lg:px-0 lg:pt-8 lg:pb-0 lg:bg-transparent lg:backdrop-blur-none flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-3">
                {schritt > 1 && (
                  <Button variante="ghost" onClick={() => geheZu(schritt - 1)} className="h-12 lg:h-auto max-[479px]:!w-auto">
                    Zurück
                  </Button>
                )}
                <Button variante="sekundaer" onClick={() => speichern()} disabled={speichert} className="h-12 lg:h-auto max-[479px]:!w-auto">
                  <span className="sm:hidden">Speichern</span>
                  <span className="hidden sm:inline">Entwurf speichern</span>
                </Button>
              </div>
              <Button type="submit" gross disabled={speichert} className="h-12 lg:h-auto flex-1 sm:flex-none max-[479px]:!w-auto">
                {schritt === 6 ? (
                  speichert ? "Wird gespeichert …" : "Speichern und zur Initiative"
                ) : (
                  <><span className="sm:hidden">Weiter</span><span className="hidden sm:inline">Weiter zu: {SCHRITTE[schritt].titel}</span></>
                )}
              </Button>
            </div>
            {schritt === 6 && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variante="ghost" onClick={pdfVorschau}>PDF-Vorschau</Button>
                {initiative && <ButtonLink href={`/stiftungsvorstand/initiativen/${initiative.id}`} variante="ghost">Zur Detailansicht ohne Speichern</ButtonLink>}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

/** Betragseingabe mit €-Zeichen (gleiche Formatierung wie im Antragsformular). */
function BetragEingabe({
  id, name, label, value, onChange, onBlur, fehler, pflicht,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  onBlur: () => void;
  fehler?: string;
  pflicht?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label htmlFor={id} className="text-sm leading-5 text-neutral-800 font-medium">
        {label}
        {pflicht && (
          <>
            <span aria-hidden="true" className="text-fehler"> *</span>
            <span className="sr-only"> (Pflichtfeld)</span>
          </>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={fehler ? true : undefined}
          aria-required={pflicht || undefined}
          aria-describedby={fehler ? `${id}-fehler` : undefined}
          className="w-full h-12 text-base rounded-pill border border-neutral-700 bg-neutral-100 pl-4 pr-9 text-right tabular-nums text-neutral-800 placeholder:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut aria-[invalid=true]:border-fehler aria-[invalid=true]:border-2"
        />
        <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700">€</span>
      </div>
      <Fehlertext id={`${id}-fehler`} text={fehler} />
    </div>
  );
}
