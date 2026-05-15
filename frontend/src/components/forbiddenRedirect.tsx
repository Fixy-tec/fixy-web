"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";

/**
 * Si el usuario ya tiene sesión (p. ej. token en localStorage sin cookie aún),
 * redirige a la ruta original o al inicio.
 */
export default function ForbiddenRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const from = searchParams.get("from");
    const target =
      from && from.startsWith("/") && !from.startsWith("/auth")
        ? from
        : "/";
    router.replace(target);
  }, [isAuthenticated, isLoading, router, searchParams]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  return null;
}
