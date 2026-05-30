import { HttpError } from "@/src/lib/httpError";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type NotificationTypeApi =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "REQUEST_COMPLETED"
  | "NEW_MATCH"
  | "RANK_UP";

export interface NotificationDto {
  id: string;
  type: NotificationTypeApi;
  title: string;
  message: string;
  /** Datos adicionales arbitrarios (requestId, applicationId, stars, etc). */
  data: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationDto[];
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchNotifications(
  token: string,
  options?: { limit?: number },
): Promise<NotificationDto[]> {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  const qs = params.toString();
  const url = `${API_BASE}/notifications${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new HttpError(
      response.status,
      (error as { message?: string }).message ??
        "Error al cargar notificaciones",
    );
  }

  const body = (await response.json()) as NotificationsResponse;
  return body.notifications;
}

/**
 * "Marcar como visto" — elimina la notificación del backend. Devuelve `true`
 * si efectivamente se borró, `false` si ya no existía.
 */
export async function deleteNotification(
  token: string,
  id: string,
): Promise<boolean> {
  const response = await fetch(`${API_BASE}/notifications/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (response.status === 204) return true;
  if (response.status === 404) return false;

  const error = await response.json().catch(() => ({}));
  throw new HttpError(
    response.status,
    (error as { message?: string }).message ??
      "No se pudo borrar la notificación",
  );
}

/** Borra todas las notificaciones del usuario. */
export async function clearAllNotifications(token: string): Promise<number> {
  const response = await fetch(`${API_BASE}/notifications`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new HttpError(
      response.status,
      (error as { message?: string }).message ??
        "No se pudieron borrar las notificaciones",
    );
  }

  const body = (await response.json()) as { deleted: number };
  return body.deleted ?? 0;
}

// ── Helpers de presentación ──────────────────────────────────────────────

/**
 * Devuelve un color/emoji acorde al tipo. Útil para el bell + dropdown.
 */
export function getNotificationStyle(type: NotificationTypeApi): {
  color: string;
  emoji: string;
} {
  switch (type) {
    case "APPLICATION_ACCEPTED":
      return { color: "#009c70", emoji: "✓" };
    case "APPLICATION_REJECTED":
      return { color: "#ef4444", emoji: "✕" };
    case "APPLICATION_RECEIVED":
      return { color: "#1a4ca3", emoji: "✉" };
    case "REQUEST_COMPLETED":
      return { color: "#f59e0b", emoji: "★" };
    case "RANK_UP":
      return { color: "#7c3aed", emoji: "↑" };
    case "NEW_MATCH":
    default:
      return { color: "#6b7280", emoji: "•" };
  }
}

/** Tiempo relativo simple: "hace 5m", "hace 2h", "hace 3d". */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks}sem`;
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}
