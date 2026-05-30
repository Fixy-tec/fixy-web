"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  DEFAULT_AVATAR_PATHS,
  PROFILE_RULES,
  fetchCurrentUser,
  isWhatsappValid,
  normalizePeWhatsapp,
  toProfileImagePath,
  updateCurrentUser,
  validateBio,
  validateName,
  validateOptionalUrl,
  type CurrentUserDto,
  type UpdateCurrentUserPayload,
} from "@/src/lib/user";

export type { CurrentUserDto, UpdateCurrentUserPayload } from "@/src/lib/user";

interface UserProfileContextValue {
  profileUser: CurrentUserDto | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  saveProfile: (payload: UpdateCurrentUserPayload) => Promise<CurrentUserDto>;
  /** Rutas públicas de avatares por defecto (onboarding / perfil). */
  defaultAvatarPaths: readonly string[];
  normalizeWhatsapp: (input: string) => string;
  /** Normaliza el path del avatar antes de persistirlo (path relativo). */
  toProfileImagePath: (publicPath: string) => string;
  /** Reglas de validación alineadas con el backend (`user.schema.ts`). */
  profileRules: typeof PROFILE_RULES;
  isWhatsappValid: (input: string) => boolean;
  validateName: (name: string | undefined) => string | null;
  validateBio: (bio: string | undefined) => string | null;
  validateOptionalUrl: (
    url: string | undefined,
    label: string,
  ) => string | null;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(
  undefined,
);

export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isAuthenticated } = useAuth();
  const [profileUser, setProfileUser] = useState<CurrentUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setProfileUser(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const user = await fetchCurrentUser(token);
      setProfileUser(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar perfil");
      setProfileUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      void refreshProfile();
    } else {
      setProfileUser(null);
    }
  }, [isAuthenticated, token, refreshProfile]);

  const saveProfile = useCallback(
    async (payload: UpdateCurrentUserPayload) => {
      if (!token) {
        throw new Error("No hay sesión activa");
      }
      setIsSaving(true);
      setError(null);
      try {
        const user = await updateCurrentUser(token, payload);
        setProfileUser(user);
        return user;
      } finally {
        setIsSaving(false);
      }
    },
    [token],
  );

  const value = useMemo<UserProfileContextValue>(
    () => ({
      profileUser,
      isLoading,
      isSaving,
      error,
      refreshProfile,
      saveProfile,
      defaultAvatarPaths: DEFAULT_AVATAR_PATHS,
      normalizeWhatsapp: normalizePeWhatsapp,
      toProfileImagePath,
      profileRules: PROFILE_RULES,
      isWhatsappValid,
      validateName,
      validateBio,
      validateOptionalUrl,
    }),
    [
      profileUser,
      isLoading,
      isSaving,
      error,
      refreshProfile,
      saveProfile,
    ],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile debe usarse dentro de UserProfileProvider");
  }
  return ctx;
}
