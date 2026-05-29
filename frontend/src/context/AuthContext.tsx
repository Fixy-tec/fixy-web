"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const current = token ?? getStoredToken();
    try {
      if (current) {
        await logoutUser(current);
      }
    } catch {
      // Red o error del servidor: igual limpiamos sesión local
    } finally {
      removeToken();
      setToken(null);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
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
