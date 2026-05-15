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
  const requestBody = {
    type: payload.type,
    title: payload.title,
    description: payload.description,
    difficulty: payload.difficulty,
    basePoints: payload.basePoints,
    participantsNeeded: payload.participantsNeeded,
    deadline: payload.deadline,
    tagIds: payload.tagIds,
    ...(payload.tags?.length ? { tags: payload.tags } : {}),
    ...(payload.economicBenefit != null && payload.economicBenefit > 0
      ? { economicBenefit: payload.economicBenefit }
      : {}),
  };

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
