"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HAUPTMENUE } from "@/content/navigation";
import { abmelden } from "@/lib/auth";
import { useAuth } from "../auth/AuthProvider";

/**
 * Schwebende Navigation als Pill (Variante A).
 * Auf der Startseite liegt sie gläsern über dem Hero-Bild (helle Schrift);
 * sobald der Hero aus dem Bild gescrollt ist – und auf allen anderen Seiten –
 * wird sie hell und deckend (dunkle Schrift).
 */
export function Header() {
  const [offen, setOffen] = useState(false);
  const [ueberHero, setUeberHero] = useState(true);
  const { benutzer } = useAuth();
  const pfad = usePathname();
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menueRef = useRef<HTMLDivElement>(null);
  const startseite = pfad === "/";

  useEffect(() => setOffen(false), [pfad]);

  useEffect(() => {
    if (!startseite) return;
    const f = () => {
      const hero = document.getElementById("hero");
      const grenze = hero ? hero.offsetHeight - 96 : 600;
      setUeberHero(window.scrollY < grenze);
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    window.addEventListener("resize", f);
    return () => {
      window.removeEventListener("scroll", f);
      window.removeEventListener("resize", f);
    };
  }, [startseite]);

  useEffect(() => {
    if (!offen) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOffen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", esc);
    menueRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [offen]);

  const glas = startseite && ueberHero && !offen;
  const bereich = benutzer ? (benutzer.rolle === "stiftungsrat" ? "/stiftungsrat" : "/konto") : null;

  async function raus() {
    await abmelden();
    router.push("/");
    router.refresh();
  }

  const fokus = glas ? "focus-visible:outline-white" : "focus-visible:outline-eisenhut";
  const link = `caps text-[14px] leading-[22px] underline-offset-[6px] hover:underline transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 ${fokus} ${glas ? "text-neutral-100" : "text-neutral-800"}`;
  const pillBtn = `inline-flex items-center justify-center rounded-pill px-5 h-11 font-display text-[15px] transition-[background-color,color,transform] duration-500 motion-safe:hover:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 ${fokus}`;
  const btnHell = `${pillBtn} bg-neutral-100 text-neutral-800`;
  const btnDunkel = `${pillBtn} bg-neutral-800 text-neutral-100`;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pt-6 pointer-events-none">
        <div
          className={`pointer-events-auto mx-auto max-w-[1200px] flex items-center justify-between gap-4 rounded-pill border pl-4 pr-2 py-2 sm:pl-5 lg:pl-6 lg:pr-2.5 lg:py-2.5 transition-[background-color,border-color,box-shadow] duration-500 ease-out backdrop-blur-md ${
            glas
              ? "bg-white/[0.14] border-white/[0.28] shadow-none"
              : "bg-neutral-200/[0.94] border-neutral-400/70 shadow-card"
          }`}
        >
          <Link
            href="/"
            aria-label="Bernhard Riepl Stiftung – zur Startseite"
            className={`inline-flex items-center gap-2.5 min-w-0 rounded-pill focus-visible:outline-2 focus-visible:outline-offset-4 ${fokus}`}
          >
            <Image src="/stiftungssymbol.svg" alt="" width={26} height={32} priority className="h-8 w-[26px] shrink-0" />
            <span
              className={`font-display font-extralight text-[18px] sm:text-[21px] leading-none truncate transition-colors duration-500 ${glas ? "text-neutral-100" : "text-neutral-800"}`}
            >
              Bernhard Riepl <span className="max-[359px]:hidden">Stiftung</span>
            </span>
          </Link>

          <nav aria-label="Hauptmenü" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {HAUPTMENUE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {benutzer ? (
              <>
                <Link href={bereich!} className={glas ? btnHell : btnDunkel}>
                  {benutzer.rolle === "stiftungsrat" ? "Stiftungsrat" : "Mein Konto"}
                </Link>
                <button type="button" onClick={raus} className={`${link} px-2 cursor-pointer`}>
                  Abmelden
                </button>
              </>
            ) : (
              <Link href="/login" className={glas ? btnHell : btnDunkel}>
                Anmelden
              </Link>
            )}
          </div>

          <button
            ref={btnRef}
            type="button"
            className={`lg:hidden shrink-0 inline-flex items-center gap-2.5 rounded-pill h-11 px-4 cursor-pointer transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 ${fokus} ${
              glas ? "bg-neutral-100 text-neutral-800" : "bg-neutral-800 text-neutral-100"
            }`}
            aria-expanded={offen}
            aria-controls="mobilmenue"
            onClick={() => setOffen((o) => !o)}
          >
            <span className="caps text-sm">Menü</span>
            <span aria-hidden="true" className="relative w-4 h-2.5">
              <span className={`absolute left-0 h-px w-4 bg-current transition-transform duration-300 ${offen ? "top-[5px] rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-px w-4 bg-current transition-transform duration-300 ${offen ? "top-[5px] -rotate-45" : "top-2.5"}`} />
            </span>
          </button>
        </div>
      </header>

      <div
        id="mobilmenue"
        ref={menueRef}
        hidden={!offen}
        className="lg:hidden fixed inset-0 z-30 bg-neutral-200 overflow-y-auto pt-[88px]"
      >
        <nav aria-label="Hauptmenü mobil" className="container-site py-8">
          <ul className="flex flex-col">
            {HAUPTMENUE.map((l) => (
              <li key={l.href} className="border-b border-neutral-400">
                <Link href={l.href} onClick={() => setOffen(false)} className="block py-5 font-display font-extralight text-3xl text-neutral-800">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            {benutzer ? (
              <>
                <Link href={bereich!} className={`${btnDunkel} h-12 text-base`}>
                  {benutzer.rolle === "stiftungsrat" ? "Stiftungsrat" : "Mein Konto"}
                </Link>
                <button type="button" onClick={raus} className={`${pillBtn} h-12 text-base border border-neutral-700 text-neutral-800`}>
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={`${btnDunkel} h-12 text-base`}>Anmelden</Link>
                <Link href="/registrieren" className={`${pillBtn} h-12 text-base border border-neutral-700 text-neutral-800`}>Konto anlegen</Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Platzhalter für die schwebende Navigation auf allen Seiten außer der Startseite */}
      {!startseite && <div aria-hidden="true" className="h-[76px] sm:h-[84px] lg:h-[104px]" />}
    </>
  );
}
