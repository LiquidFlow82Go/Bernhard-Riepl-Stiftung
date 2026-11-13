import type { Metadata } from "next";
import Link from "next/link";
import { AuthRahmen, RegistrierenFormular } from "@/components/auth/AuthFormulare";

export const metadata: Metadata = { title: "Registrieren" };

export default function Seite() {
  return (
    <AuthRahmen
      titel="Konto anlegen"
      einleitung="Mit einem Konto stellen Sie Förderanträge für Ihre Institution und verfolgen deren Stand. Die Stiftung fördert ausschließlich gemeinnützige Institutionen."
      fuss={
        <p>
          Bereits registriert?{" "}
          <Link href="/login" className="underline underline-offset-4 text-neutral-800">
            Anmelden
          </Link>
        </p>
      }
    >
      <RegistrierenFormular />
    </AuthRahmen>
  );
}
