"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HAUPTMENUE } from "@/content/navigation";
import { abmelden } from "@/lib/auth";
import { useAuth } from "../auth/AuthProvider";
import { buttonKlassen } from "../ui/Button";
import { Logo } from "./Logo";

const LINK = "caps text-[15px] leading-[22px] text-neutral-800 hover:text-neutral-700 transition-colors duration-300 underline-offset-[6px] hover:underline";

export function Header() {
  const [offen, setOffen] = useState(false);
  const [gescrollt, setGescrollt] = useState(false);
  const { benutzer } = useAuth();
  const pfad = usePathname();
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menueRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOffen(false), [pfad]);

  useEffect(() => {
    const f = () => setGescrollt(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

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

  const bereich = benutzer ? (benutzer.rolle === "stiftungsrat" ? "/stiftungsrat" : "/konto") : null;

  async function raus() {
    await abmelden();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={`sticky top-0 z-40 bg-neutral-200 transition-[border-color] duration-300 border-b ${gescrollt || offen ? "border-neutral-400" : "border-transparent"}`}
    >
      <div className="container-site flex items-center justify-between gap-4 py-4 lg:py-6">
        <Logo />

        <nav aria-label="Hauptmenü" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {HAUPTMENUE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          {benutzer ? (
            <>
              <Link href={bereich!} className={buttonKlassen("sekundaer")}>
                {benutzer.rolle === "stiftungsrat" ? "Stiftungsrat" : "Mein Konto"}
              </Link>
              <button type="button" onClick={raus} className={LINK + " cursor-pointer"}>
                Abmelden
              </button>
            </>
          ) : (
            <Link href="/login" className={buttonKlassen("primaer")}>
              Anmelden
            </Link>
          )}
        </div>

        <button
          ref={btnRef}
          type="button"
          className="lg:hidden shrink-0 inline-flex items-center gap-2.5 rounded-pill border border-neutral-700 px-3.5 h-11 cursor-pointer"
          aria-expanded={offen}
          aria-controls="mobilmenue"
          onClick={() => setOffen((o) => !o)}
        >
          <span className="caps text-sm">Menü</span>
          <span aria-hidden="true" className="relative w-5 h-3">
            <span className={`absolute left-0 h-px w-5 bg-neutral-800 transition-transform duration-300 ${offen ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 h-px w-5 bg-neutral-800 transition-transform duration-300 ${offen ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>

      <div
        id="mobilmenue"
        ref={menueRef}
        hidden={!offen}
        className="lg:hidden fixed inset-x-0 top-[77px] bottom-0 bg-neutral-200 overflow-y-auto border-t border-neutral-400"
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
                <Link href={bereich!} className={buttonKlassen("primaer", true)}>
                  {benutzer.rolle === "stiftungsrat" ? "Stiftungsrat" : "Mein Konto"}
                </Link>
                <button type="button" onClick={raus} className={buttonKlassen("ghost", true)}>
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonKlassen("primaer", true)}>Anmelden</Link>
                <Link href="/registrieren" className={buttonKlassen("ghost", true)}>Konto anlegen</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
