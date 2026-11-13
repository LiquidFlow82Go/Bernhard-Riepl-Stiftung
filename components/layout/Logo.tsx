import Image from "next/image";
import Link from "next/link";

export function Logo({ hell = false }: { hell?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 min-w-0 group" aria-label="Bernhard Riepl Stiftung – zur Startseite">
      <Image src="/stiftungssymbol.svg" alt="" width={32} height={40} priority className="h-10 w-8" />
      <span className={`font-display font-extralight text-[18px] sm:text-[22px] leading-none tracking-[0.5px] ${hell ? "text-neutral-100" : "text-neutral-800"}`}>
        Bernhard Riepl <span className="max-[359px]:hidden">Stiftung</span>
      </span>
    </Link>
  );
}
