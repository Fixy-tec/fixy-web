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
  createApplication,
  deleteApplication,
  fetchApplicationsByApplicant,
  updateApplicationStatus,
  type ApplicationStatusApi,
} from "@/src/lib/application";
import {
  createApplicantRating,
  createCreatorRating,
} from "@/src/lib/rating";
import { isHttpError } from "@/src/lib/httpError";
import {
  createRequest,
  deleteRequest,
  extendRequestDeadline,
  fetchRequestById,
  fetchRequests,
  fetchRequestsByCreator,
  updateRequest,
  basePointsForDifficulty,
  mapTipoToApi,
  DIFFICULTY_BASE_POINTS,
  DIFFICULTY_LABELS,
  REQUEST_RULES,
  validateTitle,
  validateDescription,
  validateTagIds,
  validateParticipants,
  validateEconomicBenefit,
  validateDeadline,
  type CreateRequestPayload,
  type RequestDto,
  type UpdateRequestPayload,
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
  UpdateRequestPayload,
} from "@/src/lib/request";
export type { ApplicationStatusApi } from "@/src/lib/application";

export {
  DIFFICULTY_BASE_POINTS,
  DIFFICULTY_LABELS,
  basePointsForDifficulty,
  REQUEST_RULES,
};
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
  isUpdating: boolean;
  updateError: string | null;
  updateSolicitud: (
    id: string,
    form: CreateSolicitudFormInput,
  ) => Promise<SolicitudDetailData>;
  isDeleting: boolean;
  deleteError: string | null;
  deleteSolicitud: (id: string) => Promise<void>;
  /** Aplaza la fecha límite de un request (solo el dueño) */
  isExtending: boolean;
  extendError: string | null;
  extenderDeadline: (id: string, newDeadline: string) => Promise<SolicitudDetailData>;
  /** Postular a un request con un mensaje */
  isApplying: boolean;
  applyError: string | null;
  postular: (requestId: string, message: string) => Promise<void>;
  /** Aceptar / rechazar postulantes (solo el dueño) */
  isUpdatingApplication: boolean;
  applicationActionError: string | null;
  aceptarPostulante: (applicationId: string) => Promise<void>;
  rechazarPostulante: (applicationId: string) => Promise<void>;
  /** Retirar mi propia postulación */
  retirarPostulacion: (applicationId: string) => Promise<void>;
  /** Calificar al postulante (creador) o al creador (postulante) */
  isRating: boolean;
  ratingError: string | null;
  calificarPostulante: (
    applicationId: string,
    stars: number,
    comment?: string,
  ) => Promise<void>;
  calificarCreador: (
    applicationId: string,
    stars: number,
    comment?: string,
  ) => Promise<void>;
  myRequests: Solicitud[];
  myApplications: Solicitud[];
  isLoadingLists: boolean;
  listsError: string | null;
  refreshLists: () => Promise<void>;
  currentDetail: SolicitudDetailData | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  detailNotFound: boolean;
  loadRequestDetail: (id: string) => Promise<SolicitudDetailData | null>;
  clearRequestDetail: () => void;
  /** Solicitudes abiertas de otros usuarios (pestaña Buscar) */
  exploreRequests: Solicitud[];
  isLoadingExplore: boolean;
  exploreError: string | null;
  refreshExplore: () => Promise<void>;
  /** Reglas de validación alineadas con `request.schema.ts`. */
  requestRules: typeof REQUEST_RULES;
  validateTitle: (title: string) => string | null;
  validateDescription: (description: string) => string | null;
  validateTagIds: (tagIds: string[]) => string | null;
  validateParticipants: (n: number) => string | null;
  validateEconomicBenefit: (raw: string | undefined) => string | null;
  validateDeadline: (date: string | undefined) => string | null;
}

const RequestContext = createContext<RequestContextValue | undefined>(undefined);

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isExtending, setIsExtending] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isUpdatingApplication, setIsUpdatingApplication] = useState(false);
  const [applicationActionError, setApplicationActionError] = useState<
    string | null
  >(null);
  const [isRating, setIsRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const [myRequests, setMyRequests] = useState<Solicitud[]>([]);
  const [myApplications, setMyApplications] = useState<Solicitud[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);

  const [currentDetail, setCurrentDetail] = useState<SolicitudDetailData | null>(
    null,
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailNotFound, setDetailNotFound] = useState(false);

  const [exploreRequests, setExploreRequests] = useState<Solicitud[]>([]);
  const [isLoadingExplore, setIsLoadingExplore] = useState(false);
  const [exploreError, setExploreError] = useState<string | null>(null);

  const refreshExplore = useCallback(async () => {
    if (!user?.id) {
      setExploreRequests([]);
      return;
    }

    setIsLoadingExplore(true);
    setExploreError(null);
    try {
      const open = await fetchRequests({ status: "ABIERTA" });
      setExploreRequests(
        open
          .filter((r) => r.creatorId !== user.id)
          .map((r) =>
            requestToSolicitud(r, {
              currentUserId: user.id,
              autorLabel: r.creator?.name,
            }),
          ),
      );
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error al buscar solicitudes";
      setExploreError(message);
      setExploreRequests([]);
    } finally {
      setIsLoadingExplore(false);
    }
  }, [user?.id]);

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
      setDetailNotFound(false);
      try {
        const raw = await fetchRequestById(id);
        const detail = requestToDetail(raw, { currentUserId: user?.id });
        setCurrentDetail(detail);
        return detail;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Error al cargar la solicitud";
        setDetailError(message);
        setDetailNotFound(isHttpError(e, 404));
        setCurrentDetail(null);
        return null;
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [user?.id],
  );

  const clearRequestDetail = useCallback(() => {
    setCurrentDetail(null);
    setDetailError(null);
    setDetailNotFound(false);
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

  const updateSolicitud = useCallback(
    async (id: string, form: CreateSolicitudFormInput) => {
      if (!token || !isAuthenticated) {
        throw new Error("Debes iniciar sesión para editar una solicitud");
      }

      setIsUpdating(true);
      setUpdateError(null);

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

        const rawBenefit = form.beneficio?.trim();
        const economicBenefit =
          rawBenefit && rawBenefit.length > 0
            ? Number.parseFloat(rawBenefit)
            : null;

        const payload: UpdateRequestPayload = {
          type: mapTipoToApi(form.tipo),
          title: form.titulo.trim(),
          description: form.descripcion.trim(),
          difficulty,
          basePoints,
          participantsNeeded: Number(form.participantes) || 1,
          deadline: form.fechaLimite.trim(),
          tagIds,
          economicBenefit:
            economicBenefit != null &&
            !Number.isNaN(economicBenefit) &&
            economicBenefit > 0
              ? economicBenefit
              : null,
        };

        const updated = await updateRequest(token, id, payload);
        const detail = requestToDetail(updated, { currentUserId: user?.id });
        setCurrentDetail(detail);
        await refreshLists();
        return detail;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Error al actualizar la solicitud";
        setUpdateError(message);
        throw e;
      } finally {
        setIsUpdating(false);
      }
    },
    [token, isAuthenticated, refreshLists, user?.id],
  );

  const deleteSolicitud = useCallback(
    async (id: string) => {
      if (!token || !isAuthenticated) {
        throw new Error("Debes iniciar sesión para eliminar una solicitud");
      }

      setIsDeleting(true);
      setDeleteError(null);

      try {
        await deleteRequest(token, id);
        setMyRequests((prev) => prev.filter((s) => s.id !== id));
        setCurrentDetail((prev) => (prev?.id === id ? null : prev));
        await refreshLists();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Error al eliminar la solicitud";
        setDeleteError(message);
        throw e;
      } finally {
        setIsDeleting(false);
      }
    },
    [token, isAuthenticated, refreshLists],
  );

  /** Recarga el detalle actual (si hay uno cargado) y refresca las listas. */
  const reloadCurrentDetail = useCallback(async () => {
    const currentId = currentDetail?.id;
    if (!currentId) {
      await refreshLists();
      return;
    }
    try {
      const fresh = await fetchRequestById(currentId);
      const detail = requestToDetail(fresh, { currentUserId: user?.id });
      setCurrentDetail(detail);
    } catch {
      // si falla la recarga del detalle no rompemos la acción principal
    }
    await refreshLists();
  }, [currentDetail?.id, refreshLists, user?.id]);

  const extenderDeadline = useCallback(
    async (id: string, newDeadline: string) => {
      if (!token || !isAuthenticated) {
        throw new Error("Debes iniciar sesión");
      }

      setIsExtending(true);
      setExtendError(null);
      try {
        const updated = await extendRequestDeadline(token, id, newDeadline);
        const detail = requestToDetail(updated, { currentUserId: user?.id });
        setCurrentDetail(detail);
        await refreshLists();
        return detail;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Error al aplazar la solicitud";
        setExtendError(message);
        throw e;
      } finally {
        setIsExtending(false);
      }
    },
    [token, isAuthenticated, refreshLists, user?.id],
  );

  const postular = useCallback(
    async (requestId: string, message: string) => {
      if (!token || !isAuthenticated) {
        throw new Error("Debes iniciar sesión para postular");
      }

      const trimmed = message.trim();
      if (trimmed.length === 0) {
        throw new Error("El mensaje no puede estar vacío");
      }

      setIsApplying(true);
      setApplyError(null);
      try {
        await createApplication(token, requestId, trimmed);
        await reloadCurrentDetail();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Error al postular";
        setApplyError(msg);
        throw e;
      } finally {
        setIsApplying(false);
      }
    },
    [token, isAuthenticated, reloadCurrentDetail],
  );

  const changeApplicationStatus = useCallback(
    async (applicationId: string, status: ApplicationStatusApi) => {
      if (!token || !isAuthenticated) {
        throw new Error("Debes iniciar sesión");
      }
      setIsUpdatingApplication(true);
      setApplicationActionError(null);
      try {
        await updateApplicationStatus(token, applicationId, status);
        await reloadCurrentDetail();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Error al actualizar la postulación";
        setApplicationActionError(msg);
        throw e;
      } finally {
        setIsUpdatingApplication(false);
      }
    },
    [token, isAuthenticated, reloadCurrentDetail],
  );

  const aceptarPostulante = useCallback(
    (applicationId: string) =>
      changeApplicationStatus(applicationId, "ACEPTADA"),
    [changeApplicationStatus],
  );

  const rechazarPostulante = useCallback(
    (applicationId: string) =>
      changeApplicationStatus(applicationId, "RECHAZADA"),
    [changeApplicationStatus],
  );

  const retirarPostulacion = useCallback(
    async (applicationId: string) => {
      if (!token || !isAuthenticated) {
        throw new Error("Debes iniciar sesión");
      }
      setIsUpdatingApplication(true);
      setApplicationActionError(null);
      try {
        await deleteApplication(token, applicationId);
        await reloadCurrentDetail();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Error al retirar la postulación";
        setApplicationActionError(msg);
        throw e;
      } finally {
        setIsUpdatingApplication(false);
      }
    },
    [token, isAuthenticated, reloadCurrentDetail],
  );

  const calificarPostulante = useCallback(
    async (applicationId: string, stars: number, comment?: string) => {
      if (!token || !isAuthenticated) {
        throw new Error("Debes iniciar sesión");
      }
      setIsRating(true);
      setRatingError(null);
      try {
        await createCreatorRating(token, { applicationId, stars, comment });
        await reloadCurrentDetail();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Error al calificar";
        setRatingError(msg);
        throw e;
      } finally {
        setIsRating(false);
      }
    },
    [token, isAuthenticated, reloadCurrentDetail],
  );

  const calificarCreador = useCallback(
    async (applicationId: string, stars: number, comment?: string) => {
      if (!token || !isAuthenticated) {
        throw new Error("Debes iniciar sesión");
      }
      setIsRating(true);
      setRatingError(null);
      try {
        await createApplicantRating(token, { applicationId, stars, comment });
        await reloadCurrentDetail();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Error al calificar";
        setRatingError(msg);
        throw e;
      } finally {
        setIsRating(false);
      }
    },
    [token, isAuthenticated, reloadCurrentDetail],
  );

  const value = useMemo(
    () => ({
      isCreating,
      error,
      createSolicitud,
      isUpdating,
      updateError,
      updateSolicitud,
      isDeleting,
      deleteError,
      deleteSolicitud,
      isExtending,
      extendError,
      extenderDeadline,
      isApplying,
      applyError,
      postular,
      isUpdatingApplication,
      applicationActionError,
      aceptarPostulante,
      rechazarPostulante,
      retirarPostulacion,
      isRating,
      ratingError,
      calificarPostulante,
      calificarCreador,
      myRequests,
      myApplications,
      isLoadingLists,
      listsError,
      refreshLists,
      currentDetail,
      isLoadingDetail,
      detailError,
      detailNotFound,
      loadRequestDetail,
      clearRequestDetail,
      exploreRequests,
      isLoadingExplore,
      exploreError,
      refreshExplore,
      requestRules: REQUEST_RULES,
      validateTitle,
      validateDescription,
      validateTagIds,
      validateParticipants,
      validateEconomicBenefit,
      validateDeadline,
    }),
    [
      isCreating,
      error,
      createSolicitud,
      isUpdating,
      updateError,
      updateSolicitud,
      isDeleting,
      deleteError,
      deleteSolicitud,
      isExtending,
      extendError,
      extenderDeadline,
      isApplying,
      applyError,
      postular,
      isUpdatingApplication,
      applicationActionError,
      aceptarPostulante,
      rechazarPostulante,
      retirarPostulacion,
      isRating,
      ratingError,
      calificarPostulante,
      calificarCreador,
      myRequests,
      myApplications,
      isLoadingLists,
      listsError,
      refreshLists,
      currentDetail,
      isLoadingDetail,
      detailError,
      detailNotFound,
      loadRequestDetail,
      clearRequestDetail,
      exploreRequests,
      isLoadingExplore,
      exploreError,
      refreshExplore,
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
