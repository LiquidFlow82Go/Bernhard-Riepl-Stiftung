import { ButtonLink } from "@/components/ui/Button";

export default function NichtGefunden() {
  return (
    <div className="container-site py-24 lg:py-[160px] max-w-3xl">
      <p className="caps text-sm text-neutral-700 mb-4">Fehler 404</p>
      <h1 className="text-[44px] leading-[1.1] lg:text-[60px] lg:leading-none">Diese Seite gibt es nicht</h1>
      <p className="mt-6 text-lg">Vielleicht wurde sie verschoben. Auf der Startseite finden Sie alle Inhalte der Stiftung.</p>
      <div className="mt-10">
        <ButtonLink href="/" gross>Zur Startseite</ButtonLink>
      </div>
    </div>
  );
}
