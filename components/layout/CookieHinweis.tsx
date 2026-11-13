"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COOKIE_HINWEIS } from "@/content/stiftung";
import { Button } from "../ui/Button";

const KEY = "brs-cookie-hinweis-v1";

/**
 * Cookie-Hinweis. Die Seite nutzt nur technisch notwendige Speicherungen,
 * daher reicht ein Hinweis mit Bestätigung (kein Einwilligungsdialog).
 * Nicht modal: Die Seite bleibt bedienbar; der Hinweis ist als benannter Bereich erreichbar.
 */
export function CookieHinweis() {
  const [sichtbar, setSichtbar] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setSichtbar(true);
    } catch {
      setSichtbar(true);
    }
  }, []);

  function ok() {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {}
    setSichtbar(false);
  }

  if (!sichtbar) return null;
  return (
    <div
      ref={ref}
      role="region"
      aria-label="Cookie-Hinweis"
      className="fixed z-50 inset-x-3 bottom-3 md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md bg-neutral-100 border border-neutral-400 shadow-card p-6"
    >
      <h2 className="text-xl leading-snug mb-3">Hinweis zu Cookies</h2>
      <p className="text-sm leading-relaxed">{COOKIE_HINWEIS}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button onClick={ok}>Verstanden</Button>
        <Link href="/datenschutz" className="text-sm underline underline-offset-4 text-neutral-800">
          Mehr in der Datenschutzerklärung
        </Link>
      </div>
    </div>
  );
}
