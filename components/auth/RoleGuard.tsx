"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Rolle } from "@/lib/types";
import { ButtonLink } from "../ui/Button";
import { Laden } from "../ui/Diverses";
import { useAuth } from "./AuthProvider";

/**
 * Zentrale Rollenprüfung. Phase 1: Sitzung aus der Testanmeldung.
 * Phase 2: zusätzlich serverseitig per Supabase (Middleware + Row Level Security);
 * diese Komponente bleibt als Oberflächen-Schutz bestehen.
 */
export function RoleGuard({ rollen, children }: { rollen: Rolle[]; children: ReactNode }) {
  const { benutzer, bereit } = useAuth();
  const router = useRouter();
  const pfad = usePathname();

  useEffect(() => {
    if (bereit && !benutzer) router.replace(`/login?weiter=${encodeURIComponent(pfad)}`);
  }, [bereit, benutzer, router, pfad]);

  if (!bereit || !benutzer) return <Laden text="Anmeldung wird geprüft …" />;

  if (!rollen.includes(benutzer.rolle)) {
    return (
      <div className="container-site py-24 max-w-2xl">
        <h1 className="text-4xl md:text-5xl leading-tight">Kein Zugriff</h1>
        <p className="mt-6 text-lg">
          Dieser Bereich ist für {rollen.includes("stiftungsrat") ? "den Stiftungsrat" : "Antragsteller"} bestimmt. Sie sind als{" "}
          {benutzer.rolle === "stiftungsrat" ? "Mitglied des Stiftungsrats" : "Antragsteller"} angemeldet.
        </p>
        <div className="mt-8">
          <ButtonLink href={benutzer.rolle === "stiftungsrat" ? "/stiftungsrat" : "/konto"}>Zu meinem Bereich</ButtonLink>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
