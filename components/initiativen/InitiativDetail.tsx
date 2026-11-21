"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatEuro } from "@/lib/betrag";
import { ladeInitiative, loescheInitiative, setzeInitiativStatus } from "@/lib/initiativen";
import { fehltFuerStatus, regelLabel, regelSchritt } from "@/lib/initiativeSchema";
import { INITIATIV_STATUS, INITIATIV_STATUS_LABEL, personName, type Initiative, type InitiativStatus } from "@/lib/initiativeTypen";
import { useAuth } from "../auth/AuthProvider";
import { Zurueck } from "../konto/Gemeinsam";
import { Button, ButtonLink } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Hinweisbox, Laden } from "../ui/Diverses";
import { Textbereich, Textfeld } from "../ui/Feld";
import { InitiativeKennzeichen } from "../stiftungsvorstand/Bereich";
import { InitiativStatusBadge, tag } from "./Gemeinsam";
import { InitiativAnsicht } from "./InitiativAnsicht";
import { InitiativPdfKnopf } from "./PdfKnopf";

export function InitiativDetail() {
  const { id } = useParams<{ id: string }>();
  const gespeichert = useSearchParams().get("gespeichert");
  const router = useRouter();
  const { benutzer } = useAuth();
  const [i, setI] = useState<Initiative | null | undefined>(undefined);
  const [ziel, setZiel] = useState<InitiativStatus>("entwurf");
  const [grund, setGrund] = useState("");
  const [meldung, setMeldung] = useState("");
  const [fehler, setFehler] = useState("");
  const [fehlend, setFehlend] = useState<Record<string, string>>({});
  const [laeuft, setLaeuft] = useState(false);
  const [loeschenOffen, setLoeschenOffen] = useState(false);
  const [bestaetigung, setBestaetigung] = useState("");
  const [loeschFehler, setLoeschFehler] = useState("");

  async function laden() {
    const neu = await ladeInitiative(id).catch(() => null);
    setI(neu);
    if (neu) setZiel(neu.status);
  }
  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (i === undefined) return <Laden />;
  if (i === null)
    return (
      <div className="container-site py-12">
        <Zurueck href="/stiftungsvorstand/initiativen">Alle Initiativen</Zurueck>
        <h1 className="mt-6 text-4xl">Initiative nicht gefunden</h1>
      </div>
    );

  const zurueck = INITIATIV_STATUS.indexOf(ziel) < INITIATIV_STATUS.indexOf(i.status);
  const vorschau = ziel !== i.status && !zurueck ? fehltFuerStatus(i.daten, ziel, i.dokumente) : {};
  const darfLoeschen = i.status === "entwurf" && (i.erstelltVonId === benutzer?.id || benutzer?.rolle === "admin");

  async function statusSetzen() {
    if (!i) return;
    setMeldung("");
    setFehler("");
    setFehlend({});
    if (ziel === i.status) {
      setFehler("Bitte wählen Sie einen anderen Status.");
      return;
    }
    if (zurueck && !grund.trim()) {
      setFehler("Bitte begründen Sie kurz, warum der Status zurückgesetzt wird.");
      document.getElementById("status-grund")?.focus();
      return;
    }
    setLaeuft(true);
    const r = await setzeInitiativStatus(i.id, ziel, grund);
    setLaeuft(false);
    if (!r.ok) {
      setFehler(r.fehler);
      setFehlend(r.fehlend ?? {});
      return;
    }
    setGrund("");
    await laden();
    setMeldung(`Status geändert auf „${INITIATIV_STATUS_LABEL[ziel]}“.`);
  }

  async function loeschen() {
    if (!i) return;
    setLoeschFehler("");
    const r = await loescheInitiative(i.id, bestaetigung);
    if (!r.ok) {
      setLoeschFehler(r.fehler);
      document.getElementById("loeschen-az")?.focus();
      return;
    }
    router.push(`/stiftungsvorstand/initiativen?geloescht=${encodeURIComponent(i.aktenzeichen)}`);
  }

  const offen = Object.keys(vorschau).length ? vorschau : fehlend;

  return (
    <div className="container-site pt-8 pb-12 lg:pt-12 lg:pb-20">
      <Zurueck href="/stiftungsvorstand/initiativen">Alle Initiativen</Zurueck>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <p className="caps text-sm text-neutral-700 tabular-nums">Initiative {i.aktenzeichen}</p>
            <InitiativeKennzeichen />
            <InitiativStatusBadge status={i.status} />
          </div>
          <h1 className="text-[36px] leading-[1.111] lg:text-[48px] lg:leading-[1.125]">{i.projektTitel || "Initiative ohne Titel"}</h1>
          {i.partnerName && <p className="mt-2 text-lg text-neutral-700">{i.partnerName}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/stiftungsvorstand/initiativen/${i.id}/bearbeiten`} variante="sekundaer">Bearbeiten</ButtonLink>
          <InitiativPdfKnopf initiative={i} variante="primaer" />
        </div>
      </div>

      {gespeichert && (
        <div className="mt-8">
          <Hinweisbox art="ok" rolle="status">Die Initiative wurde gespeichert.</Hinweisbox>
        </div>
      )}

      <div className="mt-12 grid gap-12 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-16 items-start">
        <div className="min-w-0 order-2 xl:order-1">
          <h2 className="mb-8 text-[30px] leading-[1.2]">Projektdokumentation</h2>
          <InitiativAnsicht
            daten={i.daten}
            aktenzeichen={i.aktenzeichen}
            dokumente={i.dokumente}
            onBearbeiten={(s) => router.push(`/stiftungsvorstand/initiativen/${i.id}/bearbeiten?schritt=${s}`)}
          />
        </div>

        <aside className="order-1 xl:order-2 xl:sticky xl:top-28 grid gap-8" aria-label="Status und Verlauf">
          <section aria-labelledby="if-status-titel" className="bg-neutral-100 border border-[#e4c9a5] shadow-card p-6">
            <h2 id="if-status-titel" className="text-2xl leading-snug">Status</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-700">Aktuell</dt>
                <dd className="mt-1.5"><InitiativStatusBadge status={i.status} /></dd>
              </div>
              <div>
                <dt className="text-neutral-700">Förderbetrag</dt>
                <dd className="mt-1 text-neutral-800 text-base tabular-nums">{i.foerderbetrag != null ? formatEuro(i.foerderbetrag) : "–"}</dd>
              </div>
              <div>
                <dt className="text-neutral-700">Angelegt</dt>
                <dd className="mt-1 text-neutral-800 text-base">{tag(i.erstelltAm)}</dd>
              </div>
              <div>
                <dt className="text-neutral-700">Von</dt>
                <dd className="mt-1 text-neutral-800 text-base">{personName(i.erstelltVon)}</dd>
              </div>
            </dl>

            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-neutral-800">Status ändern</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {INITIATIV_STATUS.map((s) => (
                  <label key={s} className={`flex items-center gap-2.5 cursor-pointer border px-3 min-h-11 ${ziel === s ? "border-neutral-800 bg-neutral-200" : "border-neutral-400"}`}>
                    <input type="radio" name="if-status" value={s} checked={ziel === s} onChange={() => { setZiel(s); setFehler(""); setFehlend({}); }} className="size-4 accent-neutral-800" />
                    <span className="text-sm text-neutral-800">{INITIATIV_STATUS_LABEL[s]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {zurueck && (
              <div className="mt-5">
                <Textbereich
                  id="status-grund"
                  label="Begründung für das Zurücksetzen"
                  hinweis="Wird mit Datum und Ihrem Namen im Verlauf gespeichert."
                  value={grund}
                  onChange={(e) => setGrund(e.target.value)}
                  pflicht
                  rows={2}
                />
              </div>
            )}

            {Object.keys(offen).length > 0 && (
              <div className="mt-5 border-l-4 border-herbstgold bg-[#e0a21a29] px-4 py-3 text-sm text-neutral-800">
                <p className="font-medium">Für „{INITIATIV_STATUS_LABEL[ziel]}“ fehlt noch:</p>
                <ul className="mt-2 grid gap-1">
                  {Object.entries(offen).map(([pfad, text]) => (
                    <li key={pfad}>
                      <Link href={`/stiftungsvorstand/initiativen/${i.id}/bearbeiten?schritt=${regelSchritt(pfad)}`} className="underline underline-offset-4">
                        Schritt {regelSchritt(pfad)}, {regelLabel(pfad)}
                      </Link>
                      <span className="sr-only">: {text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <Button onClick={statusSetzen} disabled={laeuft || ziel === i.status || Object.keys(vorschau).length > 0} className="w-full">
                {laeuft ? "Wird gespeichert …" : zurueck ? "Status zurücksetzen" : "Status ändern"}
              </Button>
            </div>
            <p role="status" className="mt-3 text-sm text-neutral-800 min-h-5">{meldung}</p>
            {fehler && <p role="alert" className="text-sm text-fehler">{fehler}</p>}
          </section>

          <section aria-labelledby="if-verlauf-titel">
            <h2 id="if-verlauf-titel" className="text-2xl leading-snug">Verlauf</h2>
            <ol className="mt-4 border-l-2 border-[#c98a4b]/60">
              {[...i.verlauf].reverse().map((v, n) => (
                <li key={n} className="relative pl-5 pb-5 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-[#8a3f0c]" />
                  <p className="text-neutral-800">
                    {v.von ? `${INITIATIV_STATUS_LABEL[v.von]} → ` : ""}
                    <strong className="font-medium">{INITIATIV_STATUS_LABEL[v.nach]}</strong>
                  </p>
                  <p className="text-sm text-neutral-700">
                    {new Date(v.am).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" })} · {personName(v.durch)}
                    {v.durch?.kuerzel ? ` (${v.durch.kuerzel})` : ""}
                  </p>
                  {v.grund && <p className="mt-1 text-sm text-neutral-800">„{v.grund}“</p>}
                </li>
              ))}
            </ol>
          </section>

          {darfLoeschen && (
            <section aria-labelledby="if-loeschen-titel" className="border border-fehler/40 bg-neutral-100 p-6">
              <h2 id="if-loeschen-titel" className="text-2xl leading-snug">Entwurf löschen</h2>
              <p className="mt-2 text-sm text-neutral-700">
                Löscht den Entwurf mit allen Dateien. Das Aktenzeichen {i.aktenzeichen} wird nicht neu vergeben. Ab „Beschlossen“ ist kein Löschen mehr möglich.
              </p>
              <div className="mt-4">
                <Button variante="gefahr" onClick={() => setLoeschenOffen(true)} aria-haspopup="dialog" className="w-full">Entwurf löschen …</Button>
              </div>
            </section>
          )}
        </aside>
      </div>

      <Dialog
        offen={loeschenOffen}
        onSchliessen={() => { setLoeschenOffen(false); setBestaetigung(""); setLoeschFehler(""); }}
        titel="Entwurf endgültig löschen?"
        beschreibung={`${i.aktenzeichen} · ${i.projektTitel || "ohne Titel"}`}
      >
        <div className="grid gap-6">
          <Textfeld
            id="loeschen-az"
            label={`Zur Bestätigung das Aktenzeichen ${i.aktenzeichen} eingeben`}
            value={bestaetigung}
            onChange={(e) => setBestaetigung(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            fehler={loeschFehler || undefined}
            pflicht
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variante="ghost" onClick={() => { setLoeschenOffen(false); setBestaetigung(""); }}>Abbrechen</Button>
            <Button variante="gefahr" onClick={loeschen}>Endgültig löschen</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
