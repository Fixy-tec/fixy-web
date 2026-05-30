import { HttpError } from "@/src/lib/httpError";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type RequestTypeApi = "ASESORIA" | "PROYECTO";

export const DIFFICULTY_BASE_POINTS: Record<number, number> = {
  1: 50,
  2: 100,
  3: 180,
  4: 280,
  5: 400,
};

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Muy fácil",
  2: "Fácil",
  3: "Intermedio",
  4: "Difícil",
  5: "Muy difícil",
};

// ── Reglas (alineadas con backend/src/validators/request.schema.ts) ──────────
export const REQUEST_RULES = {
  TITLE_MIN: 5,
  TITLE_MAX: 80,
  TITLE_REGEX: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s*/.\-#!?]+$/u,
  TITLE_MAX_SPECIAL_CHARS: 5,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 1000,
  DESCRIPTION_REGEX:
    /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s*/.\-#!?,¿¡\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u,
  DESCRIPTION_MAX_SPECIAL_CHARS: 15,
  DESCRIPTION_MAX_EMOJIS: 5,
  PARTICIPANTS_MIN: 1,
  PARTICIPANTS_MAX: 10,
  TAGS_MIN: 1,
  TAGS_MAX: 5,
} as const;

const EMOJI_REGEX_GLOBAL =
  /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
const SPECIAL_CHARS_REGEX = /[*/.\-#!?]/g;

function countMatches(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/** Misma normalización que el backend (`normalizeText`). */
export function normalizeRequestText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function validateTitle(title: string): string | null {
  const value = normalizeRequestText(title);
  if (value.length < REQUEST_RULES.TITLE_MIN)
    return `El título debe tener al menos ${REQUEST_RULES.TITLE_MIN} caracteres`;
  if (value.length > REQUEST_RULES.TITLE_MAX)
    return `El título no puede exceder ${REQUEST_RULES.TITLE_MAX} caracteres`;
  if (!REQUEST_RULES.TITLE_REGEX.test(value))
    return "El título solo permite letras (con tildes y ñ), números y signos básicos (*/.,-#!?)";
  // Nota: usamos `countMatches` (que invoca `.match()`) en vez de `.test()` para
  // evitar el estado de `lastIndex` que tienen las regex con flag /g.
  if (countMatches(value, EMOJI_REGEX_GLOBAL) > 0)
    return "El título no puede contener emojis";
  if (countMatches(value, SPECIAL_CHARS_REGEX) > REQUEST_RULES.TITLE_MAX_SPECIAL_CHARS)
    return `El título admite máximo ${REQUEST_RULES.TITLE_MAX_SPECIAL_CHARS} caracteres especiales`;
  return null;
}

export function validateDescription(description: string): string | null {
  const value = normalizeRequestText(description);
  if (value.length < REQUEST_RULES.DESCRIPTION_MIN)
    return `La descripción debe tener al menos ${REQUEST_RULES.DESCRIPTION_MIN} caracteres`;
  if (value.length > REQUEST_RULES.DESCRIPTION_MAX)
    return `La descripción no puede exceder ${REQUEST_RULES.DESCRIPTION_MAX} caracteres`;
  if (!REQUEST_RULES.DESCRIPTION_REGEX.test(value))
    return "La descripción solo permite letras (con tildes y ñ), números y signos básicos (*/.,-#!?¿¡)";
  if (countMatches(value, SPECIAL_CHARS_REGEX) > REQUEST_RULES.DESCRIPTION_MAX_SPECIAL_CHARS)
    return `La descripción admite máximo ${REQUEST_RULES.DESCRIPTION_MAX_SPECIAL_CHARS} caracteres especiales`;
  if (countMatches(value, EMOJI_REGEX_GLOBAL) > REQUEST_RULES.DESCRIPTION_MAX_EMOJIS)
    return `La descripción admite máximo ${REQUEST_RULES.DESCRIPTION_MAX_EMOJIS} emojis`;
  return null;
}

export function validateTagIds(tagIds: string[]): string | null {
  if (tagIds.length < REQUEST_RULES.TAGS_MIN) return "Selecciona al menos un tag";
  if (tagIds.length > REQUEST_RULES.TAGS_MAX)
    return `Máximo ${REQUEST_RULES.TAGS_MAX} tags`;
  return null;
}

export function validateParticipants(n: number): string | null {
  if (!Number.isFinite(n) || n < REQUEST_RULES.PARTICIPANTS_MIN)
    return "Al menos 1 participante";
  if (n > REQUEST_RULES.PARTICIPANTS_MAX)
    return `Máximo ${REQUEST_RULES.PARTICIPANTS_MAX} participantes`;
  return null;
}

export function validateEconomicBenefit(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return "Monto inválido";
  if (n <= 0) return "El monto debe ser mayor a 0";
  return null;
}

/**
 * Convierte una fecha `YYYY-MM-DD` (del `<input type="date">`) a ISO 8601
 * `YYYY-MM-DDT00:00:00.000Z`, formato requerido por `z.string().datetime()`.
 */
export function toIsoDeadline(date: string | undefined): string | undefined {
  if (!date?.trim()) return undefined;
  if (date.includes("T")) return date;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function validateDeadline(date: string | undefined): string | null {
  if (!date?.trim()) return "La fecha límite es obligatoria";
  if (!toIsoDeadline(date)) return "Fecha inválida";
  return null;
}

export interface CreateRequestPayload {
  type: RequestTypeApi;
  title: string;
  description: string;
  difficulty: number;
  basePoints: number;
  participantsNeeded: number;
  deadline?: string;
  economicBenefit?: number;
  /** UUIDs de Tag (tabla Tag → RequestTag) */
  tagIds: string[];
  /** Nombres de tag (compatibilidad con backends que lean `tags`) */
  tags?: string[];
}

/**
 * Payload de actualización: todos los campos son opcionales, pero el backend
 * sobreescribe los que vengan presentes. `economicBenefit: null` sirve para
 * limpiar el monto y `deadline` admite ISO 8601 o `YYYY-MM-DD`.
 */
export interface UpdateRequestPayload {
  type?: RequestTypeApi;
  title?: string;
  description?: string;
  difficulty?: number;
  basePoints?: number;
  participantsNeeded?: number;
  deadline?: string;
  economicBenefit?: number | null;
  status?: string;
  tagIds?: string[];
}

export interface RequestTagDto {
  requestId: string;
  tagId: string;
  tag: { id: string; name: string; isCustom: boolean };
}

export interface RequestDto {
  id: string;
  creatorId: string;
  type: RequestTypeApi;
  title: string;
  description: string;
  difficulty: number;
  basePoints: number;
  economicBenefit: number | null;
  participantsNeeded: number;
  status: string;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  tags: RequestTagDto[];
}

export interface RequestCreatorDto {
  id: string;
  name: string;
  medal?: string;
  profile?: { avatarUrl: string | null; avgRating?: number } | null;
}

export interface ApplicationRatingDto {
  id: string;
  raterId: string;
  ratedId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
}

export interface RequestApplicationDto {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  applicant?: {
    id: string;
    name: string;
    medal?: string;
    points?: number;
    profile?: { avatarUrl: string | null; avgRating?: number } | null;
  };
  ratings?: ApplicationRatingDto[];
}

/** Request con relaciones que devuelve el listado/detalle del API */
export interface RequestWithRelations extends RequestDto {
  creator?: RequestCreatorDto;
  applications?: RequestApplicationDto[];
}

export interface RequestsListResponse {
  requests: RequestWithRelations[];
}

export interface RequestDetailResponse {
  request: RequestWithRelations;
}

export interface CreateRequestResponse {
  request: RequestDto;
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(response: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body = (await response.json()) as {
      message?: string;
      fields?: string[];
    };
    if (body?.message) message = String(body.message);
    if (body?.fields?.length) {
      message = `${message} (${body.fields.join(", ")})`;
    }
  } catch {
    /* cuerpo no JSON */
  }
  throw new Error(message);
}

/** POST `/requests` — requiere JWT */
export async function createRequest(
  token: string,
  payload: CreateRequestPayload,
): Promise<RequestDto> {
  const isoDeadline = toIsoDeadline(payload.deadline);
  const requestBody: Record<string, unknown> = {
    type: payload.type,
    title: normalizeRequestText(payload.title),
    description: normalizeRequestText(payload.description),
    difficulty: payload.difficulty,
    basePoints: payload.basePoints,
    participantsNeeded: payload.participantsNeeded,
    tagIds: payload.tagIds,
  };
  if (isoDeadline) requestBody.deadline = isoDeadline;
  if (payload.economicBenefit != null && payload.economicBenefit > 0)
    requestBody.economicBenefit = payload.economicBenefit;

  if (process.env.NODE_ENV === "development") {
    console.debug("[createRequest] payload:", requestBody);
  }

  const response = await fetch(`${API_BASE}/requests`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    await parseError(response, "Error al crear la solicitud");
  }

  const data = (await response.json()) as CreateRequestResponse;
  return data.request;
}

export function mapTipoToApi(
  tipo: "Asesoría" | "Proyecto",
): RequestTypeApi {
  return tipo === "Asesoría" ? "ASESORIA" : "PROYECTO";
}

export function basePointsForDifficulty(difficulty: number): number {
  return DIFFICULTY_BASE_POINTS[difficulty] ?? DIFFICULTY_BASE_POINTS[1];
}

export interface FetchRequestsFilters {
  creatorId?: string;
  type?: RequestTypeApi;
  status?: string;
}

/** GET `/requests` con filtros opcionales (query público) */
export async function fetchRequests(
  filters?: FetchRequestsFilters,
): Promise<RequestWithRelations[]> {
  const params = new URLSearchParams();
  if (filters?.creatorId) params.set("creatorId", filters.creatorId);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.status) params.set("status", filters.status);

  const qs = params.toString();
  const response = await fetch(
    `${API_BASE}/requests${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    let message = "Error al cargar solicitudes";
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = String(body.message);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const body = (await response.json()) as RequestsListResponse;
  return body.requests ?? [];
}

/** GET `/requests?creatorId=…` */
export async function fetchRequestsByCreator(
  creatorId: string,
): Promise<RequestWithRelations[]> {
  return fetchRequests({ creatorId });
}

/** GET `/requests/:id` */
export async function fetchRequestById(
  id: string,
): Promise<RequestWithRelations> {
  const response = await fetch(`${API_BASE}/requests/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    let message = "Solicitud no encontrada";
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = String(body.message);
    } catch {
      /* ignore */
    }
    throw new HttpError(response.status, message);
  }

  const body = (await response.json()) as RequestDetailResponse;
  return body.request;
}

/** PATCH `/requests/:id` — requiere JWT y ser dueño de la solicitud */
export async function updateRequest(
  token: string,
  id: string,
  payload: UpdateRequestPayload,
): Promise<RequestWithRelations> {
  const body: Record<string, unknown> = {};
  if (payload.type !== undefined) body.type = payload.type;
  if (payload.title !== undefined) body.title = normalizeRequestText(payload.title);
  if (payload.description !== undefined)
    body.description = normalizeRequestText(payload.description);
  if (payload.difficulty !== undefined) body.difficulty = payload.difficulty;
  if (payload.basePoints !== undefined) body.basePoints = payload.basePoints;
  if (payload.participantsNeeded !== undefined)
    body.participantsNeeded = payload.participantsNeeded;
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.tagIds !== undefined) body.tagIds = payload.tagIds;

  if (payload.deadline !== undefined) {
    const iso = toIsoDeadline(payload.deadline);
    if (iso) body.deadline = iso;
  }

  if (payload.economicBenefit !== undefined) {
    body.economicBenefit = payload.economicBenefit;
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[updateRequest] payload:", body);
  }

  const response = await fetch(`${API_BASE}/requests/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseError(response, "Error al actualizar la solicitud");
  }

  const data = (await response.json()) as RequestDetailResponse;
  return data.request;
}

/** DELETE `/requests/:id` — requiere JWT y ser dueño de la solicitud */
export async function deleteRequest(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/requests/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    await parseError(response, "Error al eliminar la solicitud");
  }
}

/**
 * POST `/requests/:id/extend-deadline`
 * Aplaza el deadline de una solicitud. El backend valida ownership y que la
 * nueva fecha sea posterior al deadline actual.
 */
export async function extendRequestDeadline(
  token: string,
  id: string,
  newDeadline: string,
): Promise<RequestWithRelations> {
  const iso = toIsoDeadline(newDeadline);
  if (!iso) {
    throw new Error("Fecha inválida");
  }

  const response = await fetch(`${API_BASE}/requests/${id}/extend-deadline`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ deadline: iso }),
  });

  if (!response.ok) {
    await parseError(response, "Error al aplazar la solicitud");
  }

  const data = (await response.json()) as RequestDetailResponse;
  return data.request;
}
