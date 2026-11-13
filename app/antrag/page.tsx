import type { Metadata } from "next";
import { AntragWizard } from "@/components/antrag/AntragWizard";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata: Metadata = { title: "Förderantrag" };

export default function AntragSeite() {
  return (
    <div className="container-site py-12 lg:py-20">
      <header className="mb-12 lg:mb-16 max-w-3xl">
        <p className="caps text-sm text-neutral-700 mb-4">Formularversion V 03/2023</p>
        <h1 className="text-[44px] leading-[1.1] lg:text-[60px] lg:leading-none">Antrag auf Förderung</h1>
        <p className="mt-6 text-lg leading-[1.556]">
          Füllen Sie die sechs Schritte aus und senden Sie den Antrag ab. Felder mit <span aria-hidden="true" className="text-fehler">*</span>
          <span className="sr-only">Sternchen</span> sind Pflichtfelder.
        </p>
      </header>
      <RoleGuard rollen={["antragsteller"]}>
        <AntragWizard />
      </RoleGuard>
    </div>
  );
}
