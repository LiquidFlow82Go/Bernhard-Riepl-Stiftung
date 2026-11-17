import { Suspense } from "react";
import { AntragTabelle } from "@/components/stiftungsrat/AntragTabelle";

export default function Seite() {
  return (
    <Suspense>
      <AntragTabelle />
    </Suspense>
  );
}
