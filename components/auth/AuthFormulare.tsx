"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { anmelden, neuesPasswortSetzen, passwortZuruecksetzen, registrieren } from "@/lib/auth";
import { loginSchema, passwortNeuSchema, passwortVergessenSchema, registrierenSchema, zodFehler } from "@/lib/antragSchema";
import { istRat, type Rolle } from "@/lib/types";
import { Button } from "../ui/Button";
import { Checkbox, PasswortFeld, Textfeld } from "../ui/Feld";
import { Hinweisbox } from "../ui/Diverses";
import { supabaseKonfiguriert } from "@/lib/supabase/env";

export function AuthRahmen({ titel, einleitung, children, fuss }: { titel: string; einleitung?: ReactNode; children: ReactNode; fuss?: ReactNode }) {
  return (
    <div className="container-site py-16 lg:py-[120px]">
      <div className="mx-auto max-w-[520px]">
        <h1 className="text-[44px] leading-[1.1] lg:text-[56px]">{titel}</h1>
        {einleitung && <div className="mt-5 text-lg leading-[1.556]">{einleitung}</div>}
        {!supabaseKonfiguriert && (
          <div className="mt-8">
            <Hinweisbox art="warn">
              Die Anmeldung ist noch nicht eingerichtet: Es fehlen die Supabase-Zugangsdaten (siehe README, „Phase 2 einrichten“).
            </Hinweisbox>
          </div>
        )}
        <div className="mt-10">{children}</div>
        {fuss && <div className="mt-10 pt-8 border-t border-neutral-400 text-base">{fuss}</div>}
      </div>
    </div>
  );
}

function FehlerZusammenfassung({ fehler, refEl }: { fehler: string | null; refEl: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={refEl} tabIndex={-1} className="focus:outline-none">
      {fehler && (
        <Hinweisbox art="fehler" rolle="alert">
          {fehler}
        </Hinweisbox>
      )}
    </div>
  );
}

function zielNachLogin(rolle: Rolle, weiter: string | null) {
  if (weiter && weiter.startsWith("/") && !weiter.startsWith("//")) {
    if (istRat(rolle) && !weiter.startsWith("/stiftungsrat")) return "/stiftungsrat";
    if (rolle === "stiftungsrat" && weiter.startsWith("/stiftungsrat/antragsteller")) return "/stiftungsrat";
    if (rolle === "antragsteller" && weiter.startsWith("/stiftungsrat")) return "/konto";
    return weiter;
  }
  return istRat(rolle) ? "/stiftungsrat" : "/konto";
}

export function LoginFormular() {
  const router = useRouter();
  const params = useSearchParams();
  const weiter = params.get("weiter");
  const hinweis = params.get("hinweis");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [allg, setAllg] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function senden(e: FormEvent) {
    e.preventDefault();
    setAllg(null);
    const r = loginSchema.safeParse({ email, passwort });
    if (!r.success) {
      const f = zodFehler(r.error);
      setFehler(f);
      document.getElementById(`login-${Object.keys(f)[0]}`)?.focus();
      return;
    }
    setFehler({});
    setLaedt(true);
    const erg = await anmelden(email, passwort);
    setLaedt(false);
    if (!erg.ok) {
      setAllg(erg.fehler);
      requestAnimationFrame(() => ref.current?.focus());
      return;
    }
    router.push(zielNachLogin(erg.benutzer.rolle, weiter));
    router.refresh();
  }

  return (
    <>
      <form noValidate onSubmit={senden} className="grid gap-6">
        {hinweis === "passwort" && (
          <Hinweisbox art="ok" rolle="status">Ihr neues Passwort ist gespeichert. Bitte melden Sie sich an.</Hinweisbox>
        )}
        {hinweis === "link-ungueltig" && (
          <Hinweisbox art="warn" rolle="status">
            Der Link ist abgelaufen oder wurde bereits verwendet. Bitte melden Sie sich an oder fordern Sie einen neuen Link an.
          </Hinweisbox>
        )}
        <FehlerZusammenfassung fehler={allg} refEl={ref} />
        <Textfeld id="login-email" label="E-Mail-Adresse" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} fehler={fehler.email} pflicht />
        <PasswortFeld id="login-passwort" label="Passwort" autoComplete="current-password" value={passwort} onChange={(e) => setPasswort(e.target.value)} fehler={fehler.passwort} pflicht />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button type="submit" gross disabled={laedt}>{laedt ? "Anmeldung läuft …" : "Anmelden"}</Button>
          <Link href="/passwort-vergessen" className="underline underline-offset-4 text-neutral-800">Passwort vergessen?</Link>
        </div>
      </form>

    </>
  );
}

export function RegistrierenFormular() {
  const router = useRouter();
  const [w, setW] = useState({ name: "", institution: "", email: "", passwort: "", passwort2: "", datenschutz: false });
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [allg, setAllg] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [bestaetigen, setBestaetigen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const set = (k: keyof typeof w) => (e: { target: { value: string } }) => setW({ ...w, [k]: e.target.value });

  async function senden(e: FormEvent) {
    e.preventDefault();
    setAllg(null);
    const r = registrierenSchema.safeParse(w);
    if (!r.success) {
      const f = zodFehler(r.error);
      setFehler(f);
      document.getElementById(`reg-${Object.keys(f)[0]}`)?.focus();
      return;
    }
    setFehler({});
    setLaedt(true);
    const erg = await registrieren(w);
    setLaedt(false);
    if (!erg.ok) {
      setAllg(erg.fehler);
      requestAnimationFrame(() => ref.current?.focus());
      return;
    }
    if (erg.bestaetigungNoetig) {
      setBestaetigen(w.email.trim());
      requestAnimationFrame(() => document.getElementById("reg-bestaetigen")?.focus());
      return;
    }
    router.push("/konto?neu=1");
    router.refresh();
  }

  if (bestaetigen)
    return (
      <div id="reg-bestaetigen" tabIndex={-1} role="status" className="focus:outline-none">
        <Hinweisbox art="ok">
          <p className="font-medium">Fast geschafft – bitte bestätigen Sie Ihre E-Mail-Adresse.</p>
          <p className="mt-2">
            Wir haben eine E-Mail an <strong className="font-medium">{bestaetigen}</strong> gesendet. Klicken Sie auf den Link darin, um Ihr Konto zu aktivieren. Prüfen Sie gegebenenfalls auch den Spam-Ordner.
          </p>
        </Hinweisbox>
      </div>
    );

  return (
    <form noValidate onSubmit={senden} className="grid gap-6">
      <FehlerZusammenfassung fehler={allg} refEl={ref} />
      <Textfeld id="reg-name" label="Ihr Name" autoComplete="name" value={w.name} onChange={set("name")} fehler={fehler.name} pflicht />
      <Textfeld id="reg-institution" label="Institution" hinweis="Verein, Kirchengemeinde, gGmbH oder Stiftung" autoComplete="organization" value={w.institution} onChange={set("institution")} fehler={fehler.institution} pflicht />
      <Textfeld id="reg-email" label="E-Mail-Adresse" type="email" autoComplete="email" value={w.email} onChange={set("email")} fehler={fehler.email} pflicht />
      <PasswortFeld id="reg-passwort" label="Passwort" hinweis="Mindestens 10 Zeichen" autoComplete="new-password" value={w.passwort} onChange={set("passwort")} fehler={fehler.passwort} pflicht />
      <PasswortFeld id="reg-passwort2" label="Passwort wiederholen" autoComplete="new-password" value={w.passwort2} onChange={set("passwort2")} fehler={fehler.passwort2} pflicht />
      <Checkbox id="reg-datenschutz" checked={w.datenschutz} onChange={(v) => setW({ ...w, datenschutz: v })} fehler={fehler.datenschutz} pflicht>
        Ich habe die{" "}
        <Link href="/datenschutz" target="_blank" className="underline underline-offset-4">
          Datenschutzerklärung<span className="sr-only"> (öffnet in neuem Tab)</span>
        </Link>{" "}
        gelesen.
      </Checkbox>
      <div>
        <Button type="submit" gross disabled={laedt}>{laedt ? "Konto wird angelegt …" : "Konto anlegen"}</Button>
      </div>
    </form>
  );
}

export function PasswortVergessenFormular() {
  const [email, setEmail] = useState("");
  const [fehler, setFehler] = useState<string | undefined>();
  const [gesendet, setGesendet] = useState(false);
  const [laedt, setLaedt] = useState(false);

  async function senden(e: FormEvent) {
    e.preventDefault();
    const r = passwortVergessenSchema.safeParse({ email });
    if (!r.success) {
      setFehler(zodFehler(r.error).email);
      document.getElementById("pw-email")?.focus();
      return;
    }
    setFehler(undefined);
    setLaedt(true);
    const erg = await passwortZuruecksetzen(email);
    setLaedt(false);
    if (!erg.ok) {
      setFehler(erg.fehler);
      return;
    }
    setGesendet(true);
  }

  return (
    <div className="grid gap-6">
      <div role="status">
        {gesendet && (
          <Hinweisbox art="ok">
            Falls ein Konto mit dieser Adresse besteht, erhalten Sie in Kürze eine E-Mail mit einem Link zum Zurücksetzen.
            Prüfen Sie gegebenenfalls auch den Spam-Ordner.
          </Hinweisbox>
        )}
      </div>
      <form noValidate onSubmit={senden} className="grid gap-6">
        <Textfeld id="pw-email" label="E-Mail-Adresse" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} fehler={fehler} pflicht />
        <div>
          <Button type="submit" gross disabled={laedt}>{laedt ? "Wird gesendet …" : "Link anfordern"}</Button>
        </div>
      </form>
    </div>
  );
}

export function PasswortNeuFormular() {
  const router = useRouter();
  const [w, setW] = useState({ passwort: "", passwort2: "" });
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [allg, setAllg] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function senden(e: FormEvent) {
    e.preventDefault();
    setAllg(null);
    const r = passwortNeuSchema.safeParse(w);
    if (!r.success) {
      const f = zodFehler(r.error);
      setFehler(f);
      document.getElementById(`neu-${Object.keys(f)[0]}`)?.focus();
      return;
    }
    setFehler({});
    setLaedt(true);
    const erg = await neuesPasswortSetzen(w.passwort);
    setLaedt(false);
    if (!erg.ok) {
      setAllg(erg.fehler);
      requestAnimationFrame(() => ref.current?.focus());
      return;
    }
    router.push("/konto");
    router.refresh();
  }

  return (
    <form noValidate onSubmit={senden} className="grid gap-6">
      <FehlerZusammenfassung fehler={allg} refEl={ref} />
      <PasswortFeld id="neu-passwort" label="Neues Passwort" hinweis="Mindestens 10 Zeichen" autoComplete="new-password" value={w.passwort} onChange={(e) => setW({ ...w, passwort: e.target.value })} fehler={fehler.passwort} pflicht />
      <PasswortFeld id="neu-passwort2" label="Neues Passwort wiederholen" autoComplete="new-password" value={w.passwort2} onChange={(e) => setW({ ...w, passwort2: e.target.value })} fehler={fehler.passwort2} pflicht />
      <div>
        <Button type="submit" gross disabled={laedt}>{laedt ? "Wird gespeichert …" : "Passwort speichern"}</Button>
      </div>
    </form>
  );
}
