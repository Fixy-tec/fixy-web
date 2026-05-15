"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  createRequest,
  basePointsForDifficulty,
  mapTipoToApi,
  DIFFICULTY_BASE_POINTS,
  DIFFICULTY_LABELS,
  type CreateRequestPayload,
  type RequestDto,
} from "@/src/lib/request";

export type {
  CreateRequestPayload,
  RequestDto,
} from "@/src/lib/request";

export { DIFFICULTY_BASE_POINTS, DIFFICULTY_LABELS, basePointsForDifficulty };

/** Datos del wizard de crear solicitud (vista → contexto) */
export interface CreateSolicitudFormInput {
  tipo: "Asesoría" | "Proyecto";
  titulo: string;
  descripcion: string;
  tagIds: string[];
  /** Nombres legibles de los tags (mismo orden que tagIds) */
  tagNames?: string[];
  dificultad: number;
  fechaLimite: string;
  participantes: number;
  beneficio?: string;
}

interface RequestContextValue {
  isCreating: boolean;
  error: string | null;
  createSolicitud: (form: CreateSolicitudFormInput) => Promise<RequestDto>;
}

const RequestContext = createContext<RequestContextValue | undefined>(
  undefined,
);

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSolicitud = useCallback(
    async (form: CreateSolicitudFormInput) => {
      if (!token || !isAuthenticated) {
        throw new Error("Debes iniciar sesión para publicar una solicitud");
      }

      setIsCreating(true);
      setError(null);

      try {
        const tagIds = [...new Set(form.tagIds ?? [])];
        if (tagIds.length === 0) {
          throw new Error("Selecciona al menos un tag");
        }

        const difficulty = Number(form.dificultad);
        const basePoints = basePointsForDifficulty(difficulty);
        if (!form.fechaLimite?.trim()) {
          throw new Error("La fecha límite es obligatoria");
        }

        const economicBenefit =
          form.beneficio?.trim() !== "" && form.beneficio != null
            ? Number.parseFloat(form.beneficio)
            : undefined;

        const tagNames =
          form.tagNames?.filter((n) => n.trim().length > 0) ?? [];

        const payload: CreateRequestPayload = {
          type: mapTipoToApi(form.tipo),
          title: form.titulo.trim(),
          description: form.descripcion.trim(),
          difficulty,
          basePoints,
          participantsNeeded: Number(form.participantes) || 1,
          deadline: form.fechaLimite.trim(),
          tagIds,
          tags: tagNames.length > 0 ? tagNames : undefined,
          ...(economicBenefit != null &&
          !Number.isNaN(economicBenefit) &&
          economicBenefit > 0
            ? { economicBenefit }
            : {}),
        };

        return await createRequest(token, payload);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Error al crear la solicitud";
        setError(message);
        throw e;
      } finally {
        setIsCreating(false);
      }
    },
    [token, isAuthenticated],
  );

  const value = useMemo(
    () => ({
      isCreating,
      error,
      createSolicitud,
    }),
    [isCreating, error, createSolicitud],
  );

  return (
    <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
  );
}

export function useRequest() {
  const ctx = useContext(RequestContext);
  if (!ctx) {
    throw new Error("useRequest debe usarse dentro de RequestProvider");
  }
  return ctx;
}
