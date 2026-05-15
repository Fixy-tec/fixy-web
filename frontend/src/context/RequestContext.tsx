"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/src/context/AuthContext";
import { fetchApplicationsByApplicant } from "@/src/lib/application";
import {
  createRequest,
  fetchRequestById,
  fetchRequestsByCreator,
  basePointsForDifficulty,
  mapTipoToApi,
  DIFFICULTY_BASE_POINTS,
  DIFFICULTY_LABELS,
  type CreateRequestPayload,
  type RequestDto,
  type RequestWithRelations,
} from "@/src/lib/request";
import {
  applicationToSolicitud,
  requestToDetail,
  requestToSolicitud,
  type SolicitudDetailData,
} from "@/src/lib/solicitudMappers";
import type { Solicitud } from "@/src/components/cards/solicitudCard";

export type {
  CreateRequestPayload,
  RequestDto,
} from "@/src/lib/request";

export { DIFFICULTY_BASE_POINTS, DIFFICULTY_LABELS, basePointsForDifficulty };
export type { SolicitudDetailData };

export interface CreateSolicitudFormInput {
  tipo: "Asesoría" | "Proyecto";
  titulo: string;
  descripcion: string;
  tagIds: string[];
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
  myRequests: Solicitud[];
  myApplications: Solicitud[];
  isLoadingLists: boolean;
  listsError: string | null;
  refreshLists: () => Promise<void>;
  currentDetail: SolicitudDetailData | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  loadRequestDetail: (id: string) => Promise<SolicitudDetailData>;
  clearRequestDetail: () => void;
}

const RequestContext = createContext<RequestContextValue | undefined>(undefined);

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myRequests, setMyRequests] = useState<Solicitud[]>([]);
  const [myApplications, setMyApplications] = useState<Solicitud[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);

  const [currentDetail, setCurrentDetail] = useState<SolicitudDetailData | null>(
    null,
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const refreshLists = useCallback(async () => {
    if (!user?.id) {
      setMyRequests([]);
      setMyApplications([]);
      return;
    }

    setIsLoadingLists(true);
    setListsError(null);
    try {
      const [created, applications] = await Promise.all([
        fetchRequestsByCreator(user.id),
        fetchApplicationsByApplicant(user.id),
      ]);

      setMyRequests(
        created.map((r) =>
          requestToSolicitud(r, { currentUserId: user.id }),
        ),
      );
      setMyApplications(
        applications.map((a) => applicationToSolicitud(a, user.id)),
      );
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error al cargar solicitudes";
      setListsError(message);
      setMyRequests([]);
      setMyApplications([]);
    } finally {
      setIsLoadingLists(false);
    }
  }, [user?.id]);

  const loadRequestDetail = useCallback(
    async (id: string) => {
      setIsLoadingDetail(true);
      setDetailError(null);
      try {
        const raw = await fetchRequestById(id);
        const detail = requestToDetail(raw, { currentUserId: user?.id });
        setCurrentDetail(detail);
        return detail;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Error al cargar la solicitud";
        setDetailError(message);
        setCurrentDetail(null);
        throw e;
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [user?.id],
  );

  const clearRequestDetail = useCallback(() => {
    setCurrentDetail(null);
    setDetailError(null);
  }, []);

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

        const created = await createRequest(token, payload);
        await refreshLists();
        return created;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Error al crear la solicitud";
        setError(message);
        throw e;
      } finally {
        setIsCreating(false);
      }
    },
    [token, isAuthenticated, refreshLists],
  );

  const value = useMemo(
    () => ({
      isCreating,
      error,
      createSolicitud,
      myRequests,
      myApplications,
      isLoadingLists,
      listsError,
      refreshLists,
      currentDetail,
      isLoadingDetail,
      detailError,
      loadRequestDetail,
      clearRequestDetail,
    }),
    [
      isCreating,
      error,
      createSolicitud,
      myRequests,
      myApplications,
      isLoadingLists,
      listsError,
      refreshLists,
      currentDetail,
      isLoadingDetail,
      detailError,
      loadRequestDetail,
      clearRequestDetail,
    ],
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
