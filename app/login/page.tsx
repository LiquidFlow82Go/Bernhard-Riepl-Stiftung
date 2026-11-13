import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthRahmen, LoginFormular } from "@/components/auth/AuthFormulare";

export const metadata: Metadata = { title: "Anmelden" };

export default function Seite() {
  return (
    <AuthRahmen
      titel="Anmelden"
      einleitung="Für Antragsteller und den Stiftungsrat."
      fuss={
        <p>
          Noch kein Konto?{" "}
          <Link href="/registrieren" className="underline underline-offset-4 text-neutral-800">
            Jetzt registrieren
          </Link>
        </p>
      }
    >
      <Suspense>
        <LoginFormular />
      </Suspense>
    </AuthRahmen>
  );
}
