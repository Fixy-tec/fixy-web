import type {
  RequestWithRelations,
} from "@/src/lib/request";
import type {
  ApplicationDto,
  ApplicationStatusApi,
} from "@/src/lib/application";
import type { Solicitud } from "@/src/components/cards/solicitudCard";

export type SolicitudStatusUi =
  | "Abierta"
  | "En proceso"
  | "Completada"
  | "Cancelada";

export function mapRequestStatus(status: string): SolicitudStatusUi {
  const map: Record<string, SolicitudStatusUi> = {
    // Mientras se siguen aceptando postulaciones (ABIERTA y EN_REVISION) la
    // UI muestra "Abierta" para que el botón de postular siga habilitado.
    ABIERTA: "Abierta",
    EN_REVISION: "Abierta",
    EN_PROCESO: "En proceso",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
  };
  return map[status] ?? "Abierta";
}

/** Mapea el enum del backend al español que usamos en UI */
export function mapApplicationStatus(status: ApplicationStatusApi): string {
  const map: Record<ApplicationStatusApi, string> = {
    PENDIENTE: "Pendiente",
    ACEPTADA: "Aceptada",
    RECHAZADA: "Rechazada",
  };
  return map[status] ?? "Pendiente";
}

export function mapRequestType(type: string): Solicitud["tipo"] {
  return type === "ASESORIA" ? "Asesoría" : "Proyecto";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

function formatBeneficio(value: number | null | undefined): string | undefined {
  if (value == null || value <= 0) return undefined;
  return `S/. ${value}`;
}

/** Convierte un Request del API al modelo de la card */
export function requestToSolicitud(
  req: RequestWithRelations,
  options?: { autorLabel?: string; currentUserId?: string },
): Solicitud {
  const isOwner =
    options?.currentUserId != null && req.creatorId === options.currentUserId;

  return {
    id: req.id,
    creatorId: req.creatorId,
    tipo: mapRequestType(req.type),
    titulo: req.title,
    descripcion: req.description,
    tags: req.tags?.map((t) => t.tag.name) ?? [],
    dificultad: req.difficulty,
    fechaLimite: formatDate(req.deadline),
    fechaPublicacion: formatDate(req.createdAt),
    postulantes: req.applications?.length ?? 0,
    participantes: req.participantsNeeded,
    beneficio: formatBeneficio(req.economicBenefit),
    status: mapRequestStatus(req.status),
    autor: isOwner ? "Tú" : (options?.autorLabel ?? req.creator?.name ?? "—"),
  };
}

/** Postulación → card de la solicitud a la que aplicaste */
export function applicationToSolicitud(
  app: ApplicationDto,
  currentUserId?: string,
): Solicitud {
  return requestToSolicitud(app.request, {
    autorLabel: app.request.creator?.name ?? "—",
    currentUserId,
  });
}

/** Información detallada de un postulante para vistas de detalle */
export interface PostulanteDetalle {
  /** ID de la application (no del usuario) */
  id: string;
  applicationId: string;
  applicantId: string;
  nombre: string;
  mensaje: string;
  status: ApplicationStatusApi;
  statusLabel: string;
  avatarUrl?: string;
  medalla?: string;
  rating?: number;
  createdAt: string;
  /**
   * `true` cuando el usuario actual (sea creador o aplicante) ya envió
   * un rating asociado a esta application. Sirve para evitar que el modal
   * de calificación se vuelva a abrir/mostrar después de calificar.
   */
  ratedByCurrentUser: boolean;
}

/** Datos extendidos para vistas de detalle */
export interface SolicitudDetailData extends Solicitud {
  descripcionCompleta: string;
  basePoints: number;
  /** UUIDs de los tags asociados (útil para precargar el formulario de edición) */
  tagIds: string[];
  /** Monto crudo (número) — `null` cuando no hay beneficio económico */
  beneficioMonto: number | null;
  /** ISO completos sin recortar (la columna `deadline` puede ser null en BD) */
  deadlineIso: string | null;
  createdAtIso: string;
  /** UUID del creador (siempre presente, conveniente para checks) */
  creatorIdRaw: string;
  /** Status crudo del backend (para distinguir ABIERTA vs EN_REVISION, etc.) */
  statusRaw: string;
  /** True cuando el backend marcó el request como expirado */
  isExpired: boolean;
  autorAvatar?: string;
  autorMedalla?: string;
  autorRating?: number;
  postulantesDetalle: PostulanteDetalle[];
}

export function requestToDetail(
  req: RequestWithRelations,
  options?: { currentUserId?: string },
): SolicitudDetailData {
  const card = requestToSolicitud(req, {
    currentUserId: options?.currentUserId,
    autorLabel: req.creator?.name,
  });

  return {
    ...card,
    descripcionCompleta: req.description,
    basePoints: req.basePoints,
    tagIds: req.tags?.map((t) => t.tag.id) ?? [],
    beneficioMonto: req.economicBenefit ?? null,
    deadlineIso: req.deadline ?? null,
    createdAtIso: req.createdAt,
    creatorIdRaw: req.creatorId,
    statusRaw: req.status,
    isExpired: Boolean((req as { isExpired?: boolean }).isExpired),
    autorAvatar: req.creator?.profile?.avatarUrl ?? undefined,
    autorMedalla: req.creator?.medal,
    autorRating: req.creator?.profile?.avgRating,
    postulantesDetalle:
      req.applications?.map((a) => {
        const ratedByCurrentUser =
          options?.currentUserId != null &&
          (a.ratings ?? []).some(
            (r) => r.raterId === options.currentUserId,
          );

        return {
          id: a.id,
          applicationId: a.id,
          applicantId: a.applicant?.id ?? "",
          nombre: a.applicant?.name ?? "Postulante",
          mensaje: a.message,
          status: a.status as ApplicationStatusApi,
          statusLabel: mapApplicationStatus(a.status as ApplicationStatusApi),
          avatarUrl: a.applicant?.profile?.avatarUrl ?? undefined,
          medalla: a.applicant?.medal,
          rating: a.applicant?.profile?.avgRating,
          createdAt: a.createdAt,
          ratedByCurrentUser,
        };
      }) ?? [],
  };
}
