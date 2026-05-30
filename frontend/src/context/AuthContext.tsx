"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  registerUser,
  loginUser,
  logoutUser,
  getStoredToken,
  saveToken,
  removeToken,
  syncAuthCookieFromStorage,
  isTokenValid,
  decodeToken,
  type RegisterPayload,
  type LoginPayload,
  type AuthResponse,
} from "@/src/lib/auth";

// Tipos reexportados
export type { RegisterPayload, LoginPayload, AuthResponse };

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /**
   * `true` desde el instante en que se invoca `logout()` y hasta que la
   * navegación a `/auth/*` se completa. Sirve para que vistas protegidas
   * NO disparen su redirect a `/forbidden` durante el cierre de sesión
   * (la sesión termina voluntariamente, no es un acceso prohibido).
   */
  isLoggingOut: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Una vez que la navegación nos llevó a /auth/*, podemos bajar el flag.
  // Esto evita que el flag quede pegado en `true` y bloquee redirecciones
  // legítimas a /forbidden cuando un usuario sin sesión escribe una URL
  // protegida en la barra del navegador.
  useEffect(() => {
    if (isLoggingOut && pathname?.startsWith("/auth")) {
      setIsLoggingOut(false);
    }
  }, [pathname, isLoggingOut]);

  // Verificar token al montar
  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken && isTokenValid(storedToken)) {
      const decoded = decodeToken(storedToken);
      if (decoded) {
        setToken(storedToken);
        // Reconstituir usuario desde el token
        setUser({
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || decoded.email,
          role: decoded.role,
        });
      }
    } else if (storedToken) {
      // Token expirado, remover
      removeToken();
    }
    syncAuthCookieFromStorage();
    setIsLoading(false);
  }, []);

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setIsLoggingOut(false);
    try {
      const response = await registerUser(payload);
      saveToken(response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    setIsLoggingOut(false);
    try {
      const response = await loginUser(payload);
      saveToken(response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // 1) Marcamos el flag ANTES de tocar nada para que cualquier vista
    //    protegida que re-renderice vea `isLoggingOut === true` y NO dispare
    //    su redirect a `/forbidden` cuando notemos que la sesión se fue.
    setIsLoggingOut(true);

    const current = token ?? getStoredToken();
    try {
      if (current) {
        await logoutUser(current);
      }
    } catch {
      // Red o error del servidor: igual limpiamos sesión local
    }

    // 2) Limpieza local del storage + cookie.
    removeToken();

    // 3) Navegamos PRIMERO (antes de soltar `setToken/setUser`) para que la
    //    ruta destino ya esté en transición cuando se propague el cambio de
    //    `isAuthenticated`. El navbar ya no necesita llamar a `router.push`.
    router.replace("/auth/login");

    // 4) Limpieza de estado React (provoca el re-render con
    //    isAuthenticated=false; las vistas que estén montadas verán
    //    `isLoggingOut=true` y se quedarán quietas hasta desmontar).
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isLoggingOut,
    register,
    login,
    logout,
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
