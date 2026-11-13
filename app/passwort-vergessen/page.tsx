import type { Metadata } from "next";
import Link from "next/link";
import { AuthRahmen, PasswortVergessenFormular } from "@/components/auth/AuthFormulare";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function Seite() {
  return (
    <AuthRahmen
      titel="Passwort vergessen"
      einleitung="Geben Sie die E-Mail-Adresse Ihres Kontos an. Wir senden Ihnen einen Link, mit dem Sie ein neues Passwort festlegen."
      fuss={
        <p>
          <Link href="/login" className="underline underline-offset-4 text-neutral-800">
            Zurück zur Anmeldung
          </Link>
        </p>
      }
    >
      <PasswortVergessenFormular />
    </AuthRahmen>
  );
}
