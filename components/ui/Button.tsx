import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariante = "primaer" | "sekundaer" | "ghost" | "aufDunkel" | "aufDunkelVoll" | "gefahr";

const BASIS =
  "inline-flex items-center justify-center gap-2 rounded-pill px-[18px] py-[11px] font-display font-normal text-[15px] leading-[19px] text-center cursor-pointer select-none " +
  "transition-[transform,background-color,color] duration-300 motion-safe:hover:scale-[.96] disabled:cursor-not-allowed disabled:hover:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eisenhut max-[479px]:w-full";

const VARIANTEN: Record<ButtonVariante, string> = {
  primaer:
    "bg-neutral-800 text-neutral-100 border border-neutral-800 shadow-button disabled:bg-neutral-300 disabled:border-neutral-300 disabled:text-neutral-700 disabled:shadow-none",
  sekundaer: "bg-neutral-100 text-neutral-800 border border-neutral-400 shadow-button",
  ghost: "bg-transparent text-neutral-800 border border-neutral-700",
  aufDunkel: "bg-transparent text-neutral-100 border border-neutral-100",
  aufDunkelVoll: "bg-neutral-100 text-neutral-800 border border-neutral-400",
  gefahr: "bg-fehler text-neutral-100 border border-fehler shadow-button",
};

export function buttonKlassen(v: ButtonVariante = "primaer", gross = false, extra = "") {
  return `${BASIS} ${VARIANTEN[v]} ${gross ? "text-base px-6 py-3" : ""} ${extra}`;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: ButtonVariante; gross?: boolean };

export function Button({ variante = "primaer", gross, className = "", type = "button", ...rest }: BtnProps) {
  return <button type={type} className={buttonKlassen(variante, gross, className)} {...rest} />;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variante?: ButtonVariante;
  gross?: boolean;
  children: ReactNode;
};

export function ButtonLink({ href, variante = "primaer", gross, className = "", ...rest }: LinkProps) {
  return <Link href={href} className={buttonKlassen(variante, gross, className)} {...rest} />;
}
