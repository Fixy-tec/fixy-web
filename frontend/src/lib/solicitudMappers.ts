import type {
  RequestWithRelations,
} from "@/src/lib/request";
import type { ApplicationDto } from "@/src/lib/application";
import type { Solicitud } from "@/src/components/cards/solicitudCard";

export type SolicitudStatusUi =
  | "Abierta"
  | "En proceso"
  | "Completada"
  | "Cancelada";

export function mapRequestStatus(status: string): SolicitudStatusUi {
  const map: Record<string, SolicitudStatusUi> = {
    ABIERTA: "Abierta",
    EN_REVISION: "En proceso",
    EN_PROCESO: "En proceso",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
  };
  return map[status] ?? "Abierta";
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

/** Datos extendidos para vistas de detalle */
export interface SolicitudDetailData extends Solicitud {
  descripcionCompleta: string;
  basePoints: number;
  autorAvatar?: string;
  autorMedalla?: string;
  autorRating?: number;
  postulantesDetalle: Array<{
    id: string;
    nombre: string;
    mensaje: string;
  }>;
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
    autorAvatar: req.creator?.profile?.avatarUrl ?? undefined,
    autorMedalla: req.creator?.medal,
    autorRating: req.creator?.profile?.avgRating,
    postulantesDetalle:
      req.applications?.map((a) => ({
        id: a.id,
        nombre: a.applicant?.name ?? "Postulante",
        mensaje: a.message,
      })) ?? [],
  };
}
