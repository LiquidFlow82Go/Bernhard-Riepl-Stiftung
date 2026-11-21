import { Suspense } from "react";
import { AntragTabelle } from "@/components/stiftungsvorstand/AntragTabelle";

export default function Seite() {
  return (
    <Suspense>
      <AntragTabelle />
    </Suspense>
  );
}
