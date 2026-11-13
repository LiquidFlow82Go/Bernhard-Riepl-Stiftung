import Image from "next/image";
import Link from "next/link";
import { HAUPTMENUE, RECHTLICHES } from "@/content/navigation";
import { STIFTUNG } from "@/content/stiftung";
import { MitPlatzhaltern } from "../ui/Diverses";

export function Footer() {
  return (
    <footer className="bg-neutral-800 text-neutral-300 pt-[72px] pb-10">
      <div className="container-site">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/stiftungssymbol.svg" alt="" width={40} height={50} className="h-[50px] w-10" />
              <p className="font-display font-extralight text-2xl text-neutral-100 leading-tight">
                Bernhard Riepl
                <br />
                Stiftung
              </p>
            </div>
            <p className="mt-6 max-w-sm text-base leading-relaxed">{STIFTUNG.zweckKurz}.</p>
          </div>
          <div>
            <h2 className="font-display text-lg font-medium text-neutral-100 mb-4">Anschrift</h2>
            <address className="not-italic text-base leading-relaxed">
              {STIFTUNG.anschrift.zeile1}
              <br />
              {STIFTUNG.anschrift.strasse}
              <br />
              {STIFTUNG.anschrift.ort}
            </address>
            <p className="mt-3 text-base">
              <MitPlatzhaltern text={STIFTUNG.email} />
            </p>
          </div>
          <nav aria-label="Seitenbereiche">
            <h2 className="font-display text-lg font-medium text-neutral-100 mb-4">Seite</h2>
            <ul className="grid gap-2">
              {HAUPTMENUE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-base hover:text-neutral-100 hover:underline underline-offset-4">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Rechtliches">
            <h2 className="font-display text-lg font-medium text-neutral-100 mb-4">Rechtliches</h2>
            <ul className="grid gap-2">
              {RECHTLICHES.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-base hover:text-neutral-100 hover:underline underline-offset-4">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-base hover:text-neutral-100 hover:underline underline-offset-4">
                  Anmelden
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <hr className="border-0 h-px bg-neutral-700 mt-14 mb-6" />
        <p className="text-sm">© {new Date().getFullYear()} Bernhard Riepl Stiftung · Miesbach</p>
      </div>
    </footer>
  );
}
