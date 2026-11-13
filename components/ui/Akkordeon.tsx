"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";

export interface AkkordeonEintrag {
  titel: string;
  inhalt: React.ReactNode;
}

/** Akkordeon nach WAI-ARIA-Muster: Button mit aria-expanded in Überschrift, Panel als region. */
export function Akkordeon({ eintraege, ueberschriftEbene = 3 }: { eintraege: AkkordeonEintrag[]; ueberschriftEbene?: 2 | 3 | 4 }) {
  const basis = useId();
  const [offen, setOffen] = useState<number | null>(0);
  const H = `h${ueberschriftEbene}` as "h3";
  return (
    <div className="border-t border-neutral-400">
      {eintraege.map((e, i) => {
        const auf = offen === i;
        const btnId = `${basis}-b${i}`;
        const panelId = `${basis}-p${i}`;
        return (
          <div key={i} className="border-b border-neutral-400">
            <H className="m-0 text-xl md:text-2xl leading-snug">
              <button
                id={btnId}
                type="button"
                aria-expanded={auf}
                aria-controls={panelId}
                onClick={() => setOffen(auf ? null : i)}
                className="w-full flex items-center justify-between gap-6 py-6 text-left font-display font-extralight text-neutral-800 cursor-pointer hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
              >
                <span>{e.titel}</span>
                <span aria-hidden="true" className="relative size-5 shrink-0">
                  <span className="absolute left-0 top-1/2 h-px w-5 bg-neutral-800" />
                  <span
                    className={`absolute left-1/2 top-0 w-px h-5 bg-neutral-800 transition-transform duration-300 ${auf ? "scale-y-0" : ""}`}
                  />
                </span>
              </button>
            </H>
            <AnimatePresence initial={false}>
              {auf && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pb-7 pr-10 text-base leading-relaxed max-w-[72ch]">{e.inhalt}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
