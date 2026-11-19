"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { reicheAntragEin } from "@/lib/antraege";
import { feldId, labelFuer, PFLICHTFELDER, validiere, type Fehler } from "@/lib/antragSchema";
import { ladeBlobHerunter } from "@/lib/dokumente";
import { sendeEingangsbestaetigung, type EingangErgebnis } from "@/lib/email";
import { erzeugeAntragPdf, pdfDateiname } from "@/lib/pdf";
import { leererAntrag, type Antrag, type AntragDaten, type DokumentKategorie } from "@/lib/types";
import { useAuth } from "../auth/AuthProvider";
import { Button, ButtonLink } from "../ui/Button";
import { AntragKontext, setzeAnPfad } from "./AntragKontext";
import { Schritt1, Schritt2, Schritt3, Schritt4, Schritt5, Schritt6 } from "./Schritte";

const SCHRITTE = [
  { nr: 1, titel: "Antragsteller", lang: "Angaben zum Antragsteller", C: Schritt1 },
  { nr: 2, titel: "Projekt", lang: "Angaben zum Projekt", C: Schritt2 },
  { nr: 3, titel: "Anschluss", lang: "Anschlussperspektive", C: Schritt3 },
  { nr: 4, titel: "Finanzen", lang: "Finanzielle Angaben", C: Schritt4 },
  { nr: 5, titel: "Dokumente", lang: "Dokumente hochladen", C: Schritt5 },
  { nr: 6, titel: "Zusammenfassung", lang: "Zusammenfassung und Absenden", C: Schritt6 },
];

const ENTWURF_KEY = "brs-antrag-entwurf-v2";

const leereDateien = (): Record<DokumentKategorie, File[]> => ({
  freistellung: [], satzung: [], vereinsregister: [], gemeinnuetzigkeit: [], weitere: [],
});

function entwurfSpeichern(daten: AntragDaten, schritt: number) {
  try {
    const ohneKonto = { ...daten, konto: { ...daten.konto, iban: "", bic: "" }, bestaetigung: false, datenschutz: false };
    localStorage.setItem(ENTWURF_KEY, JSON.stringify({ daten: ohneKonto, schritt, gespeichert: new Date().toISOString() }));
  } catch {}
}

export function AntragWizard() {
  const { benutzer } = useAuth();
  const [daten, setDaten] = useState<AntragDaten>(leererAntrag);
  const [schritt, setSchritt] = useState(1);
  const [fehler, setFehler] = useState<Fehler>({});
  const [zeigeUebersicht, setZeigeUebersicht] = useState(false);
  const [dateien, setDateienState] = useState(leereDateien);
  const [geladen, setGeladen] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const [sendet, setSendet] = useState(false);
  const [ergebnis, setErgebnis] = useState<{ antrag: Antrag; fehlgeschlagen: string[]; mail: EingangErgebnis } | null>(null);
  const [sendeFehler, setSendeFehler] = useState("");
  const titelRef = useRef<HTMLHeadingElement>(null);
  const uebersichtRef = useRef<HTMLDivElement>(null);
  const fokusNach = useRef<string | null>(null);
  const navigiert = useRef(false);

  // Entwurf laden bzw. mit Kontodaten vorbelegen
  useEffect(() => {
    let d = leererAntrag();
    try {
      const raw = localStorage.getItem(ENTWURF_KEY);
      if (raw) {
        const e = JSON.parse(raw);
        d = { ...d, ...e.daten, konto: { ...d.konto, ...e.daten?.konto } };
        setSchritt(Math.min(Math.max(1, e.schritt ?? 1), 6));
        setHinweis(`Ihr Entwurf vom ${new Date(e.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} wurde wiederhergestellt.`);
      }
    } catch {}
    if (benutzer) {
      if (!d.antragsteller.name && benutzer.institution) d.antragsteller.name = benutzer.institution;
      if (!d.antragsteller.email) d.antragsteller.email = benutzer.email;
    }
    setDaten(d);
    setGeladen(true);
  }, [benutzer]);

  // Entwurf automatisch speichern
  useEffect(() => {
    if (!geladen || ergebnis) return;
    const t = setTimeout(() => entwurfSpeichern(daten, schritt), 400);
    return () => clearTimeout(t);
  }, [daten, schritt, geladen, ergebnis]);

  // Fokus nach Schrittwechsel auf die Schrittüberschrift oder ein bestimmtes Feld
  useEffect(() => {
    if (!navigiert.current) return;
    navigiert.current = false;
    const ziel = fokusNach.current;
    fokusNach.current = null;
    requestAnimationFrame(() => {
      const el = ziel ? document.getElementById(ziel) : titelRef.current;
      el?.scrollIntoView({ block: "center" });
      el?.focus({ preventScroll: true });
    });
  }, [schritt]);

  const setze = useCallback((pfad: string, wert: unknown) => {
    setDaten((d) => setzeAnPfad(d, pfad, wert));
    setFehler((f) => {
      if (!f[pfad]) return f;
      const n = { ...f };
      delete n[pfad];
      return n;
    });
  }, []);

  const setDateien = useCallback((k: DokumentKategorie, f: File[]) => setDateienState((d) => ({ ...d, [k]: f })), []);

  const geheZu = useCallback((s: number, fokusPfad?: string) => {
    fokusNach.current = fokusPfad ? feldId(fokusPfad) : null;
    navigiert.current = true;
    setZeigeUebersicht(false);
    if (s === schritt && fokusPfad) {
      document.getElementById(feldId(fokusPfad))?.focus();
      return;
    }
    setSchritt(s);
  }, [schritt]);

  function pruefe(nur?: number): boolean {
    const f = validiere(daten, nur);
    setFehler(f);
    const ok = Object.keys(f).length === 0;
    setZeigeUebersicht(!ok);
    if (!ok) requestAnimationFrame(() => uebersichtRef.current?.focus());
    return ok;
  }

  function weiter() {
    if (!pruefe(schritt)) return;
    navigiert.current = true;
    setSchritt((s) => Math.min(6, s + 1));
  }

  function zurueck() {
    setZeigeUebersicht(false);
    navigiert.current = true;
    setSchritt((s) => Math.max(1, s - 1));
  }

  async function absenden() {
    if (!benutzer || sendet) return;
    if (!pruefe()) return;
    setSendet(true);
    setSendeFehler("");
    try {
      const dokumente = Object.entries(dateien).flatMap(([kategorie, fs]) =>
        fs.map((datei) => ({ kategorie: kategorie as DokumentKategorie, datei })),
      );
      const erg = await reicheAntragEin(daten, dokumente);
      try { localStorage.removeItem(ENTWURF_KEY); } catch {}
      // Ein Fehler beim Mailversand blockiert das Absenden nicht.
      const mail = await sendeEingangsbestaetigung(erg.antrag.id);
      setErgebnis({ ...erg, mail });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0 });
        document.getElementById("erfolg-titel")?.focus();
      });
    } catch {
      setSendeFehler("Der Antrag konnte nicht gesendet werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut. Ihre Eingaben bleiben erhalten.");
      requestAnimationFrame(() => document.getElementById("sende-fehler")?.focus());
    } finally {
      setSendet(false);
    }
  }

  async function entwurfPdf() {
    const dok = Object.entries(dateien).flatMap(([kategorie, fs]) => fs.map((f) => ({ kategorie, dateiname: f.name })));
    const blob = await erzeugeAntragPdf({ daten, dokumente: dok });
    ladeBlobHerunter(blob, pdfDateiname(undefined, daten.projekt.titel));
  }

  function verwerfen() {
    if (!window.confirm("Möchten Sie den Entwurf wirklich verwerfen? Alle Eingaben gehen verloren.")) return;
    try { localStorage.removeItem(ENTWURF_KEY); } catch {}
    const d = leererAntrag();
    if (benutzer) {
      d.antragsteller.name = benutzer.institution ?? "";
      d.antragsteller.email = benutzer.email;
    }
    setDaten(d);
    setDateienState(leereDateien());
    setFehler({});
    setZeigeUebersicht(false);
    setHinweis("Der Entwurf wurde verworfen.");
    setSchritt(1);
  }

  const kontext = useMemo(() => ({ daten, setze, fehler, dateien, setDateien, geheZu }), [daten, setze, fehler, dateien, setDateien, geheZu]);

  if (ergebnis) return <Erfolg antrag={ergebnis.antrag} fehlgeschlagen={ergebnis.fehlgeschlagen} mail={ergebnis.mail} />;
  if (!geladen) return null;

  const aktuell = SCHRITTE[schritt - 1];
  const Schritt = aktuell.C;
  const fehlerListe = Object.entries(fehler);

  return (
    <AntragKontext.Provider value={kontext}>
      <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
        {/* Fortschritt */}
        <nav aria-label="Schritte des Antrags" className="lg:sticky lg:top-28 lg:self-start">
          <ol className="flex lg:flex-col justify-between lg:justify-start gap-1 pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-l border-neutral-400">
            {SCHRITTE.map((s) => {
              const aktiv = s.nr === schritt;
              const erledigt = s.nr < schritt;
              return (
                <li key={s.nr} className="lg:shrink-0">
                  <button
                    type="button"
                    onClick={() => geheZu(s.nr)}
                    aria-current={aktiv ? "step" : undefined}
                    className={`flex items-center justify-center lg:justify-start gap-3 min-h-11 min-w-11 lg:py-2.5 lg:px-3 lg:pl-5 text-left cursor-pointer whitespace-nowrap lg:-ml-px lg:border-l-2 ${aktiv ? "lg:border-neutral-800 text-neutral-800" : "lg:border-transparent text-neutral-700 hover:text-neutral-800"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`grid place-items-center size-9 lg:size-7 rounded-pill text-sm lg:text-xs tabular-nums ${aktiv ? "bg-neutral-800 text-neutral-100" : erledigt ? "bg-wiese text-neutral-100" : "border border-neutral-700 bg-neutral-100"}`}
                    >
                      {erledigt ? "✓" : s.nr}
                    </span>
                    <span className={`sr-only lg:not-sr-only ${aktiv ? "font-medium" : ""}`}>
                      <span className="sr-only">Schritt {s.nr}: </span>
                      {s.titel}
                      {erledigt && <span className="sr-only"> (bearbeitet)</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="hidden lg:block mt-8 text-sm text-neutral-700">
            Ihre Eingaben werden automatisch auf diesem Gerät gespeichert.
          </p>
          <button type="button" onClick={verwerfen} className="hidden lg:block mt-3 text-sm underline underline-offset-4 text-neutral-800 cursor-pointer">
            Entwurf verwerfen
          </button>
        </nav>

        <div className="min-w-0">
          <p role="status" className="text-sm text-neutral-700 min-h-5 mb-2">{hinweis}</p>

          {zeigeUebersicht && fehlerListe.length > 0 && (
            <div ref={uebersichtRef} tabIndex={-1} role="alert" aria-labelledby="fehler-titel" className="mb-10 border-2 border-fehler bg-[#b3361a0d] p-6 focus:outline-2 focus:outline-offset-2 focus:outline-eisenhut">
              <h2 id="fehler-titel" className="text-2xl leading-snug text-neutral-800">
                {fehlerListe.length === 1 ? "Bitte korrigieren Sie eine Angabe" : `Bitte korrigieren Sie ${fehlerListe.length} Angaben`}
              </h2>
              <ul className="mt-4 grid gap-2">
                {fehlerListe.map(([pfad, text]) => {
                  const ziel = PFLICHTFELDER.find((r) => r.pfad === pfad)?.schritt ?? (pfad.startsWith("konto") || pfad.startsWith("kosten") || pfad.startsWith("finanzierung") ? 4 : 1);
                  return (
                    <li key={pfad}>
                      <a
                        href={`#${feldId(pfad)}`}
                        onClick={(e) => { e.preventDefault(); geheZu(ziel, pfad); }}
                        className="text-fehler underline underline-offset-4"
                      >
                        {ziel !== schritt && <span>Schritt {ziel}, {labelFuer(pfad)}: </span>}
                        {text}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <p className="caps text-sm text-neutral-700">Schritt {schritt} von 6</p>
          <h2 ref={titelRef} tabIndex={-1} className="mt-2 mb-10 text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125] focus:outline-none">
            {aktuell.lang}
          </h2>

          <form noValidate onSubmit={(e) => { e.preventDefault(); if (schritt === 6) absenden(); else weiter(); }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={schritt}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <Schritt />
              </motion.div>
            </AnimatePresence>

            {sendeFehler && (
              <div id="sende-fehler" tabIndex={-1} role="alert" className="mt-12 border-l-4 border-fehler bg-[#b3361a12] px-5 py-4 text-neutral-800 focus:outline-none">
                {sendeFehler}
              </div>
            )}
            {schritt === 6 && (
              <div className="mt-12 lg:hidden">
                <Button variante="sekundaer" onClick={entwurfPdf} className="h-12">
                  Entwurf als PDF
                </Button>
              </div>
            )}
            <div className="aktionsleiste sticky bottom-0 z-20 -mx-6 mt-10 px-6 pt-3 bg-neutral-200/95 backdrop-blur-sm border-t border-neutral-400 lg:static lg:mx-0 lg:mt-16 lg:px-0 lg:pt-8 lg:pb-0 lg:bg-transparent lg:backdrop-blur-none flex items-center justify-between gap-3">
              <div className="flex gap-3">
                {schritt > 1 && (
                  <Button variante="ghost" onClick={zurueck} className="h-12 lg:h-auto max-[479px]:!w-auto">
                    Zurück
                  </Button>
                )}
                {schritt === 6 && (
                  <span className="hidden lg:block">
                    <Button variante="sekundaer" onClick={entwurfPdf}>
                      Entwurf als PDF
                    </Button>
                  </span>
                )}
              </div>
              <Button type="submit" gross disabled={sendet} aria-disabled={sendet} className="h-12 lg:h-auto flex-1 sm:flex-none max-[479px]:!w-auto">
                {schritt === 6 ? (
                  sendet ? "Wird gesendet …" : <><span className="sm:hidden">Absenden</span><span className="hidden sm:inline">Antrag verbindlich absenden</span></>
                ) : (
                  <><span className="sm:hidden">Weiter</span><span className="hidden sm:inline">Weiter zu: {SCHRITTE[schritt].titel}</span></>
                )}
              </Button>
            </div>
            <button type="button" onClick={verwerfen} className="lg:hidden mt-6 min-h-11 text-sm underline underline-offset-4 text-neutral-800 cursor-pointer">
              Entwurf verwerfen
            </button>
          </form>
        </div>
      </div>
    </AntragKontext.Provider>
  );
}

function Erfolg({ antrag, fehlgeschlagen, mail }: { antrag: Antrag; fehlgeschlagen: string[]; mail: EingangErgebnis }) {
  const [laedt, setLaedt] = useState(false);
  async function pdf() {
    setLaedt(true);
    const blob = await erzeugeAntragPdf({
      daten: antrag.daten,
      nummer: antrag.nummer,
      eingereichtAm: antrag.eingereichtAm,
      dokumente: antrag.dokumente,
    });
    ladeBlobHerunter(blob, pdfDateiname(antrag.nummer, antrag.daten.projekt.titel));
    setLaedt(false);
  }
  return (
    <div className="max-w-[760px]">
      <p className="caps text-sm text-wiese">Antrag eingegangen</p>
      <h2 id="erfolg-titel" tabIndex={-1} className="mt-3 text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125] focus:outline-none">
        Vielen Dank für Ihren Antrag
      </h2>
      <div className="mt-10 border-y border-neutral-400 py-8">
        <p className="text-sm text-neutral-700">Ihre Antragsnummer</p>
        <p className="mt-1 font-display font-extralight text-[60px] leading-none text-neutral-800 tabular-nums">{antrag.nummer}</p>
        <p className="mt-4 text-base">
          Bitte geben Sie diese Nummer bei Rückfragen an. Den Stand Ihres Antrags „{antrag.daten.projekt.titel}“ sehen Sie
          jederzeit in Ihrem Konto.
        </p>
      </div>
      <p className="mt-6 text-base">
        {mail.antragsteller?.status === "gesendet" || mail.antragsteller?.status === "bereits_gesendet"
          ? `Eine Eingangsbestätigung haben wir an ${antrag.kontoEmail ?? "Ihre Konto-Adresse"} gesendet.`
          : "Die Eingangsbestätigung per E-Mail konnte gerade nicht versendet werden. Ihr Antrag ist trotzdem vollständig eingegangen – Sie finden ihn jederzeit in Ihrem Konto."}
      </p>
      {fehlgeschlagen.length > 0 && (
        <div role="alert" className="mt-6 border-l-4 border-herbstgold bg-[#e0a21a29] px-5 py-4 text-neutral-800">
          Folgende Dateien konnten nicht hochgeladen werden: {fehlgeschlagen.join(", ")}. Ihr Antrag ist trotzdem eingegangen.
          Bitte senden Sie die fehlenden Unterlagen unter Angabe der Antragsnummer an die Stiftung.
        </div>
      )}
      <div className="mt-10 flex flex-wrap gap-4">
        <Button onClick={pdf} gross disabled={laedt}>
          {laedt ? "PDF wird erstellt …" : "Antrag als PDF herunterladen"}
        </Button>
        <ButtonLink href="/konto" variante="ghost" gross>
          Zu meinen Anträgen
        </ButtonLink>
      </div>
      <p className="mt-10">
        <Link href="/" className="underline underline-offset-4 text-neutral-800">Zur Startseite</Link>
      </p>
    </div>
  );
}
