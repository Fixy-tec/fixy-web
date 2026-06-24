"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  readAuthCookie,
  resolveAuthToken,
  saveToken,
} from "@/src/lib/auth";
import { useAuth } from "@/src/context/AuthContext";

/**
 * Recibe el JWT del callback OAuth (query `token` o cookie),
 * lo persiste en localStorage + cookie y redirige al destino final.
 */
export default function GoogleCompleteView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const run = async () => {
      const next = searchParams.get("next") ?? "/home";

      // 1) Token del handoff OAuth (query) — fuente más fiable tras redirect
      const fromQuery = searchParams.get("token");
      // 2) Cookie seteada por la API route
      const fromCookie = readAuthCookie();
      const token = fromQuery ?? fromCookie ?? resolveAuthToken();

      if (!token) {
        router.replace("/auth/login?error=missing_token");
        return;
      }

      try {
        saveToken(token);
        await refreshSession();
        router.replace(next);
      } catch {
        router.replace("/auth/login?error=session_invalid");
      }
    };

    void run();
  }, [router, searchParams, refreshSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefefe]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3] mx-auto mb-3" />
        <p className="text-sm text-gray-500">Completando inicio de sesión…</p>
      </div>
    </div>
  );
}
