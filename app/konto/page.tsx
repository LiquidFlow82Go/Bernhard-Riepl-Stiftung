import { Suspense } from "react";
import { KontoUebersicht } from "@/components/konto/KontoUebersicht";

export default function Seite() {
  return (
    <Suspense>
      <KontoUebersicht />
    </Suspense>
  );
}
