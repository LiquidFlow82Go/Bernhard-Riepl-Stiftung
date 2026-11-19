import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata: Metadata = { title: "Stiftungsvorstand", robots: { index: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuard rollen={["stiftungsrat"]}>{children}</RoleGuard>;
}
