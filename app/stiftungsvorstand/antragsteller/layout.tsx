import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";

/** Lesende Antragsteller-Ansicht: nur Admins (zusätzlich in middleware.ts geschützt). */
export default function Layout({ children }: { children: ReactNode }) {
  return <RoleGuard rollen={["admin"]}>{children}</RoleGuard>;
}
