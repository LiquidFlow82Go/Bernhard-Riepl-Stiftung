"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { aktuellerBenutzer } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { supabaseKonfiguriert } from "@/lib/supabase/env";
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
    if (!supabaseKonfiguriert) {
      setBereit(true);
      return;
    }
    let aktiv = true;
    const lade = async () => {
      const b = await aktuellerBenutzer().catch(() => null);
      if (aktiv) {
        setBenutzer(b);
        setBereit(true);
      }
    };
    lade();
    const { data } = supabase().auth.onAuthStateChange((ereignis) => {
      if (ereignis === "SIGNED_OUT") {
        setBenutzer(null);
        return;
      }
      if (ereignis === "SIGNED_IN" || ereignis === "USER_UPDATED") {
        // Außerhalb des Callbacks laden, sonst kann der Auth-Client blockieren.
        setTimeout(lade, 0);
      }
    });
    return () => {
      aktiv = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return <Ctx.Provider value={{ benutzer, bereit }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
