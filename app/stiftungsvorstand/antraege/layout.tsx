import { BereichRahmen } from "@/components/stiftungsvorstand/Bereich";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BereichRahmen art="antraege">{children}</BereichRahmen>;
}
