import { Suspense } from "react";
import { InitiativBearbeiten } from "@/components/initiativen/InitiativBearbeiten";

export default function Seite() {
  return (
    <Suspense>
      <InitiativBearbeiten />
    </Suspense>
  );
}
