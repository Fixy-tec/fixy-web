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
    profile?: { avatarUrl: string | null } | null;
  };
}

export interface ApplicationsResponse {
  applications: ApplicationDto[];
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
    let message = "Error al cargar postulaciones";
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = String(body.message);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const body = (await response.json()) as ApplicationsResponse;
  return body.applications ?? [];
}
