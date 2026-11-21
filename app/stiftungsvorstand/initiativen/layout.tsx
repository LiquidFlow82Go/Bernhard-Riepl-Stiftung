import type { Metadata } from "next";
import { BereichRahmen } from "@/components/stiftungsvorstand/Bereich";

export const metadata: Metadata = { title: "Eigene Initiativen" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BereichRahmen art="initiativen">{children}</BereichRahmen>;
}
