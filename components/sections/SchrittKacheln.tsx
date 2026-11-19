"use client";

import { useEffect, useRef } from "react";
import { ABLAUF } from "@/content/foerderantrag";

/**
 * „In vier Schritten zur Förderung“ als warme Kacheln.
 * Desktop: sanftes Anheben beim Überfahren (nur mit Maus).
 * Smartphone/Tablet: kleine Einblend-Animation, sobald die Kachel ins Bild kommt.
 * Bei „Bewegung reduzieren“ entfallen beide Effekte.
 */
export function SchrittKacheln() {
  const liste = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = liste.current;
    if (!el) return;
    const kacheln = Array.from(el.querySelectorAll<HTMLElement>(".schritt-kachel"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      kacheln.forEach((k) => k.classList.add("ist-sichtbar"));
      return;
    }
    const io = new IntersectionObserver(
      (eintraege) => {
        for (const e of eintraege) {
          if (e.isIntersecting) {
            e.target.classList.add("ist-sichtbar");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    kacheln.forEach((k) => io.observe(k));
    return () => io.disconnect();
  }, []);

  return (
    <ol ref={liste} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {ABLAUF.map((s, i) => (
        <li
          key={s.nr}
          className="schritt-kachel group relative flex flex-col overflow-hidden rounded-[22px] border border-[#ecd9bd] bg-[#f8eedf] p-7 lg:p-8"
          style={{ ["--verzoegerung" as string]: `${i * 90}ms` }}
        >
          <span aria-hidden="true" className="schritt-linie absolute inset-x-0 top-0 h-1 bg-herbstgold" />
          <span aria-hidden="true" className="schritt-nr block font-display font-extralight text-[56px] leading-none text-[#b5651d]">
            {s.nr}
          </span>
          <h3 className="schritt-titel mt-6 mb-3 text-2xl leading-[1.333] text-neutral-800">
            <span className="sr-only">Schritt {i + 1}: </span>
            {s.titel}
          </h3>
          <p className="text-base text-neutral-700">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
