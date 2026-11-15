import type { Metadata } from "next";
import { AuthRahmen, PasswortNeuFormular } from "@/components/auth/AuthFormulare";

export const metadata: Metadata = { title: "Neues Passwort", robots: { index: false } };

export default function Seite() {
  return (
    <AuthRahmen titel="Neues Passwort festlegen" einleitung="Wählen Sie ein neues Passwort für Ihr Konto.">
      <PasswortNeuFormular />
    </AuthRahmen>
  );
}
