"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { STATUS_LABEL, type AntragStatus } from "@/lib/types";

/** Text mit [Platzhaltern] – diese werden sichtbar markiert. */
export function MitPlatzhaltern({ text }: { text: string }) {
  const teile = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {teile.map((t, i) =>
        /^\[[^\]]+\]$/.test(t) ? (
          <mark key={i} className="platzhalter text-neutral-800" title="Platzhalter – noch zu ergänzen">
            {t}
          </mark>
        ) : (
          <span key={i} className="whitespace-pre-line">{t}</span>
        ),
      )}
    </>
  );
}

const STATUS_STIL: Record<AntragStatus, string> = {
  eingegangen: "bg-neutral-100 text-neutral-800 border border-neutral-700",
  in_pruefung: "bg-herbstgold text-neutral-800",
  bewilligt: "bg-wiese text-neutral-100",
  abgelehnt: "bg-neutral-800 text-neutral-100",
};

export function StatusBadge({ status }: { status: AntragStatus }) {
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-xs leading-normal caps whitespace-nowrap ${STATUS_STIL[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Kicker({ children, hell }: { children: ReactNode; hell?: boolean }) {
  return <p className={`caps text-sm leading-5 mb-4 ${hell ? "text-neutral-300" : "text-neutral-700"}`}>{children}</p>;
}

/**
 * Dezentes Einblenden beim Scrollen. Inhalte sind ohne JavaScript und bei
 * „Bewegung reduzieren“ sofort sichtbar; animiert wird nur, was beim Laden
 * unterhalb des sichtbaren Bereichs liegt.
 */
export function Einblenden({ children, className = "", verzoegerung = 0 }: { children: ReactNode; className?: string; verzoegerung?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [versteckt, setVersteckt] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setVersteckt(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVersteckt(false);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`motion-safe:transition-[opacity,translate] motion-safe:duration-700 ease-out ${versteckt ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"} ${className}`}
      style={{ transitionDelay: `${verzoegerung}s` }}
    >
      {children}
    </div>
  );
}

export function Hinweisbox({ art = "info", children, rolle }: { art?: "info" | "ok" | "warn" | "fehler"; children: ReactNode; rolle?: "status" | "alert" }) {
  const stil = {
    info: "bg-neutral-300/60 border-neutral-400",
    ok: "bg-[#3f6b2314] border-wiese",
    warn: "bg-[#e0a21a29] border-herbstgold",
    fehler: "bg-[#b3361a12] border-fehler",
  }[art];
  return (
    <div role={rolle} className={`border-l-4 ${stil} px-5 py-4 text-neutral-800`}>
      {children}
    </div>
  );
}

export function Laden({ text = "Wird geladen …" }: { text?: string }) {
  return (
    <p role="status" className="py-16 text-center text-neutral-700">
      {text}
    </p>
  );
}

