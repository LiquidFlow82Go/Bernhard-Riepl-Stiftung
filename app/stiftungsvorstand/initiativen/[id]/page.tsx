import { Suspense } from "react";
import { InitiativDetail } from "@/components/initiativen/InitiativDetail";

export default function Seite() {
  return (
    <Suspense>
      <InitiativDetail />
    </Suspense>
  );
}
