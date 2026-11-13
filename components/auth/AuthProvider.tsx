"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { aktuelleSitzung } from "@/lib/auth";
import type { Benutzer } from "@/lib/types";

interface AuthKontext {
  benutzer: Benutzer | null;
  bereit: boolean;
}

const Ctx = createContext<AuthKontext>({ benutzer: null, bereit: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [benutzer, setBenutzer] = useState<Benutzer | null>(null);
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    const lese = () => setBenutzer(aktuelleSitzung());
    lese();
    setBereit(true);
    window.addEventListener("brs-sitzung", lese);
    window.addEventListener("storage", lese);
    return () => {
      window.removeEventListener("brs-sitzung", lese);
      window.removeEventListener("storage", lese);
    };
  }, []);

  return <Ctx.Provider value={{ benutzer, bereit }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
