"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { istRat, type Rolle } from "@/lib/types";
import { ButtonLink } from "../ui/Button";
import { Laden } from "../ui/Diverses";
import { useAuth } from "./AuthProvider";

/**
 * Zentrale Rollenprüfung in der Oberfläche. Serverseitig schützen zusätzlich
 * middleware.ts (Weiterleitung nach Rolle) und Row Level Security (Daten).
 */
export function RoleGuard({ rollen, children }: { rollen: Rolle[]; children: ReactNode }) {
  const { benutzer, bereit } = useAuth();
  const router = useRouter();
  const pfad = usePathname();

  useEffect(() => {
    if (bereit && !benutzer) router.replace(`/login?weiter=${encodeURIComponent(pfad)}`);
  }, [bereit, benutzer, router, pfad]);

  if (!bereit || !benutzer) return <Laden text="Anmeldung wird geprüft …" />;

  // Admins haben alle Rechte des Stiftungsvorstands.
  const erlaubt = rollen.includes(benutzer.rolle) || (benutzer.rolle === "admin" && rollen.includes("stiftungsrat"));
  if (!erlaubt) {
    const rat = istRat(benutzer.rolle);
    return (
      <div className="container-site py-24 max-w-2xl">
        <h1 className="text-4xl md:text-5xl leading-tight">Kein Zugriff</h1>
        <p className="mt-6 text-lg">
          Dieser Bereich ist für {rollen.includes("admin") && !rollen.includes("stiftungsrat") ? "Admins" : rollen.includes("stiftungsrat") ? "den Stiftungsvorstand" : "Antragsteller"} bestimmt. Sie sind als{" "}
          {benutzer.rolle === "admin" ? "Admin" : rat ? "Mitglied des Stiftungsvorstands" : "Antragsteller"} angemeldet.
        </p>
        <div className="mt-8">
          <ButtonLink href={rat ? "/stiftungsvorstand" : "/konto"}>Zu meinem Bereich</ButtonLink>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
