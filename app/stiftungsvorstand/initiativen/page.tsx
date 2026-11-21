import { Suspense } from "react";
import { InitiativListe } from "@/components/initiativen/InitiativListe";

export default function Seite() {
  return (
    <Suspense>
      <InitiativListe />
    </Suspense>
  );
}
