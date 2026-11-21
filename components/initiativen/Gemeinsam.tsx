"use client";

import { INITIATIV_STATUS_LABEL, type InitiativStatus } from "@/lib/initiativeTypen";

const STIL: Record<InitiativStatus, string> = {
  entwurf: "bg-neutral-100 text-neutral-800 border border-neutral-700",
  beschlossen: "bg-herbstgold text-neutral-800",
  ausgezahlt: "bg-eisenhut text-neutral-100",
  abgeschlossen: "bg-wiese text-neutral-100",
};

export function InitiativStatusBadge({ status }: { status: InitiativStatus }) {
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-xs leading-normal caps whitespace-nowrap ${STIL[status]}`}>
      {INITIATIV_STATUS_LABEL[status]}
    </span>
  );
}

/** JJJJ-MM-TT bzw. ISO-Zeitstempel → TT.MM.JJJJ */
export function tag(iso?: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });
}
