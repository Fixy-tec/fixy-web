const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

import type { RequestWithRelations } from "@/src/lib/request";

export type ApplicationStatusApi =
  | "PENDIENTE"
  | "ACEPTADA"
  | "RECHAZADA";

export interface ApplicationDto {
  id: string;
  requestId: string;
  applicantId: string;
  message: string;
  status: ApplicationStatusApi;
  createdAt: string;
  request: RequestWithRelations;
  applicant?: {
    id: string;
    name: string;
    medal?: string;
    profile?: { avatarUrl: string | null; avgRating?: number } | null;
  };
}

export interface ApplicationsResponse {
  applications: ApplicationDto[];
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

/** GET `/applications?applicantId=…` */
export async function fetchApplicationsByApplicant(
  applicantId: string,
): Promise<ApplicationDto[]> {
  const params = new URLSearchParams({ applicantId });
  const response = await fetch(`${API_BASE}/applications?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    await parseError(response, "Error al cargar postulaciones");
  }

  const body = (await response.json()) as ApplicationsResponse;
  return body.applications ?? [];
}

/** POST `/applications` — el applicantId sale del JWT en el back */
export async function createApplication(
  token: string,
  requestId: string,
  message: string,
): Promise<ApplicationDto> {
  const response = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ requestId, message: message.trim() }),
  });

  if (!response.ok) {
    await parseError(response, "Error al postularse");
  }

  return (await response.json()) as ApplicationDto;
}

/** PATCH `/applications/:id` — solo el dueño del request puede cambiar status */
export async function updateApplicationStatus(
  token: string,
  applicationId: string,
  status: ApplicationStatusApi,
): Promise<ApplicationDto> {
  const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    await parseError(response, "Error al actualizar la postulación");
  }

  return (await response.json()) as ApplicationDto;
}

/** DELETE `/applications/:id` — el aplicante o el dueño pueden borrarla */
export async function deleteApplication(
  token: string,
  applicationId: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    await parseError(response, "Error al eliminar la postulación");
  }
}
