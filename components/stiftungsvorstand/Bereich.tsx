"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { zaehle } from "@/lib/initiativen";

export type BereichArt = "antraege" | "initiativen";

/**
 * Die zwei Bereiche des Stiftungsvorstands. Farbe ist nie das einzige Merkmal:
 * jeder Bereich hat zusätzlich Namen, Symbol und – bei Initiativen – ein
 * Kennzeichen an jedem Eintrag.
 */
export const BEREICHE: Record<BereichArt, { label: string; href: string; tabelle: "antraege" | "initiativen"; seite: string; aktiv: string }> = {
  antraege: {
    label: "Eingegangene Anträge",
    href: "/stiftungsvorstand/antraege",
    tabelle: "antraege",
    seite: "bg-neutral-200",
    aktiv: "bg-neutral-800 text-neutral-100",
  },
  initiativen: {
    label: "Eigene Initiativen",
    href: "/stiftungsvorstand/initiativen",
    tabelle: "initiativen",
    seite: "bg-[#fbf2e4]",
    aktiv: "bg-[#8a3f0c] text-neutral-100",
  },
};

export function BereichSymbol({ art, className = "size-5" }: { art: BereichArt; className?: string }) {
  return art === "antraege" ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M3 13l2.5-8h13L21 13v6H3v-6z" />
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

/** Kennzeichen „Initiative“ an jedem Eintrag dieses Bereichs. */
export function InitiativeKennzeichen() {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-[#c98a4b] bg-[#f6e3c8] px-2 py-0.5 text-xs text-[#5c2a08] whitespace-nowrap">
      <BereichSymbol art="initiativen" className="size-3.5" />
      Initiative
    </span>
  );
}

export function BereichRahmen({ art, children }: { art: BereichArt; children: ReactNode }) {
  const router = useRouter();
  const pfad = usePathname();
  const [anzahl, setAnzahl] = useState<Record<BereichArt, number | null>>({ antraege: null, initiativen: null });
  const refs = useRef<Record<BereichArt, HTMLAnchorElement | null>>({ antraege: null, initiativen: null });

  useEffect(() => {
    let aktiv = true;
    Promise.all([zaehle("antraege"), zaehle("initiativen")]).then(([a, i]) => {
      if (aktiv) setAnzahl({ antraege: a, initiativen: i });
    });
    return () => {
      aktiv = false;
    };
  }, [pfad]);

  const reihenfolge: BereichArt[] = ["antraege", "initiativen"];

  function taste(e: KeyboardEvent<HTMLAnchorElement>, a: BereichArt) {
    const i = reihenfolge.indexOf(a);
    let ziel: BereichArt | null = null;
    if (e.key === "ArrowRight") ziel = reihenfolge[(i + 1) % reihenfolge.length];
    if (e.key === "ArrowLeft") ziel = reihenfolge[(i - 1 + reihenfolge.length) % reihenfolge.length];
    if (e.key === "Home") ziel = reihenfolge[0];
    if (e.key === "End") ziel = reihenfolge[reihenfolge.length - 1];
    if (ziel) {
      e.preventDefault();
      refs.current[ziel]?.focus();
    }
    if (e.key === " ") {
      e.preventDefault();
      router.push(BEREICHE[a].href);
    }
  }

  return (
    <div className={`${BEREICHE[art].seite} min-h-[70vh] transition-colors duration-300`}>
      <div className="container-site pt-8 lg:pt-12">
        <div role="tablist" aria-label="Bereiche des Stiftungsvorstands" className="inline-flex max-w-full rounded-pill border border-neutral-400 bg-neutral-100 p-1 shadow-card">
          {reihenfolge.map((a) => {
            const b = BEREICHE[a];
            const gewaehlt = a === art;
            return (
              <Link
                key={a}
                ref={(el) => {
                  refs.current[a] = el;
                }}
                href={b.href}
                role="tab"
                id={`bereich-tab-${a}`}
                aria-selected={gewaehlt}
                aria-controls="bereich-inhalt"
                tabIndex={gewaehlt ? 0 : -1}
                onKeyDown={(e) => taste(e, a)}
                className={`inline-flex items-center gap-2 min-h-11 rounded-pill px-4 sm:px-5 text-[15px] font-display transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut ${
                  gewaehlt ? b.aktiv : "text-neutral-800 hover:bg-neutral-300/70"
                }`}
              >
                <BereichSymbol art={a} />
                <span>
                  <span className="max-[479px]:hidden">{b.label}</span>
                  <span className="min-[480px]:hidden">{a === "antraege" ? "Anträge" : "Initiativen"}</span>
                  {anzahl[a] != null && <span className="tabular-nums"> ({anzahl[a]})</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <div role="tabpanel" id="bereich-inhalt" aria-labelledby={`bereich-tab-${art}`}>
        {children}
      </div>
    </div>
  );
}
