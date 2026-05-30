const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface RatingDto {
  id: string;
  applicationId: string;
  raterId: string;
  ratedId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
}

export interface CreateRatingPayload {
  applicationId: string;
  stars: number;
  comment?: string;
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
    const body = (await response.json()) as { message?: string };
    if (body?.message) message = String(body.message);
  } catch {
    /* cuerpo no JSON */
  }
  throw new Error(message);
}

/**
 * POST `/ratings` — el CREADOR califica a un postulante aceptado.
 * Requiere que el Request esté en COMPLETADA.
 */
export async function createCreatorRating(
  token: string,
  payload: CreateRatingPayload,
): Promise<RatingDto> {
  const body: Record<string, unknown> = {
    applicationId: payload.applicationId,
    stars: payload.stars,
  };
  const comment = payload.comment?.trim();
  if (comment) body.comment = comment;

  const response = await fetch(`${API_BASE}/ratings`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseError(response, "Error al calificar al postulante");
  }

  return (await response.json()) as RatingDto;
}

/**
 * POST `/ratings/applicant` — el POSTULANTE aceptado califica al creador.
 * Requiere que el Request esté en COMPLETADA.
 */
export async function createApplicantRating(
  token: string,
  payload: CreateRatingPayload,
): Promise<RatingDto> {
  const body: Record<string, unknown> = {
    applicationId: payload.applicationId,
    stars: payload.stars,
  };
  const comment = payload.comment?.trim();
  if (comment) body.comment = comment;

  const response = await fetch(`${API_BASE}/ratings/applicant`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseError(response, "Error al calificar al creador");
  }

  return (await response.json()) as RatingDto;
}
