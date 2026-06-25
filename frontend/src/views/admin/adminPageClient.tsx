"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { isAdmin } from "@/src/lib/admin";

export default function AdminPageClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isAuthenticated, isLoading, isLoggingOut } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isLoggingOut) return;
    if (!isAuthenticated || !token || !isAdmin(user)) {
      router.replace(
        `/forbidden?from=${encodeURIComponent(pathname ?? "/admin")}`,
      );
    }
  }, [
    isLoading,
    isLoggingOut,
    isAuthenticated,
    token,
    user,
    router,
    pathname,
  ]);

  if (isLoading || !isAuthenticated || !isAdmin(user)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-[#f6f8fb]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  return <>{children}</>;
}
