"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  logoutUser,
  getStoredToken,
  saveToken,
  removeToken,
  syncAuthCookieFromStorage,
  isTokenValid,
  decodeToken,
  fetchAuthMe,
  resolveAuthToken,
  readAuthCookie,
  type AuthUser,
} from "@/src/lib/auth";
export type { AuthUser as User };

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const PROTECTED_PREFIXES = [
  "/applications",
  "/find",
  "/ranking",
  "/users",
  "/home",
  "/admin",
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isLoggingOut && pathname?.startsWith("/auth")) {
      setIsLoggingOut(false);
    }
  }, [pathname, isLoggingOut]);

  const refreshSession = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken || !isTokenValid(storedToken)) {
      removeToken();
      setToken(null);
      setUser(null);
      return;
    }

    try {
      const me = await fetchAuthMe(storedToken);
      setToken(storedToken);
      setUser(me);
      saveToken(storedToken);
    } catch {
      removeToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      // Sincronizar cookie → localStorage (p.ej. tras OAuth antes de /complete)
      const cookieToken = readAuthCookie();
      if (cookieToken && isTokenValid(cookieToken)) {
        saveToken(cookieToken);
      }

      const storedToken = resolveAuthToken();
      if (storedToken && isTokenValid(storedToken)) {
        try {
          const me = await fetchAuthMe(storedToken);
          setToken(storedToken);
          setUser(me);
        } catch {
          const decoded = decodeToken(storedToken);
          if (decoded && typeof decoded.userId === "string") {
            setToken(storedToken);
            setUser({
              id: decoded.userId as string,
              email: (decoded.email as string) ?? "",
              name: (decoded.email as string) ?? "",
              role: (decoded.role as string) ?? "USER",
              profileCompleted: false,
            });
          } else {
            removeToken();
          }
        }
      } else if (storedToken) {
        removeToken();
      }
      syncAuthCookieFromStorage();
      setIsLoading(false);
    };

    void init();
  }, []);

  // Redirigir a onboarding si el perfil no está completo
  useEffect(() => {
    if (isLoading || isLoggingOut || !user || !token) return;

    const onOnboarding = pathname?.startsWith("/auth/on-boarding");
    const onAuthFlow =
      pathname?.startsWith("/auth") || pathname?.startsWith("/api/auth");

    if (user.profileCompleted || onOnboarding || onAuthFlow) return;

    const isProtected = PROTECTED_PREFIXES.some((p) => pathname?.startsWith(p));
    if (isProtected) {
      router.replace("/auth/on-boarding");
    }
  }, [isLoading, isLoggingOut, user, token, pathname, router]);

  const logout = async () => {
    setIsLoggingOut(true);
    const current = token ?? getStoredToken();
    try {
      if (current) await logoutUser(current);
    } catch {
      /* ignore */
    }
    removeToken();
    router.replace("/auth/login");
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isLoggingOut,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
}
