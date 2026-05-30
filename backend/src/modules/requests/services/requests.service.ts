import * as requestsRepository from "../repositories/requests.repository";
import * as tagRepository from "../../tags/repositories/tag.repository";
import { RequestType, RequestStatus } from "@prisma/client";
import prisma from "../../../prisma";

interface CreateRequestInput {
  creatorId: string;
  type: RequestType;
  title: string;
  description: string;
  difficulty: number;
  basePoints: number;
  economicBenefit?: number;
  participantsNeeded: number;
  deadline?: Date;
  tagIds: string[];
}

interface UpdateRequestInput {
  type?: RequestType;
  title?: string;
  description?: string;
  difficulty?: number;
  basePoints?: number;
  economicBenefit?: number;
  participantsNeeded?: number;
  deadline?: Date;
  status?: RequestStatus;
  tagIds?: string[];
}

export class InvalidTagIdsError extends Error {
  constructor() {
    super("Uno o más tags no existen en el catálogo");
    this.name = "InvalidTagIdsError";
  }
}

async function resolveTagIds(tagIdsOrNames: string[]): Promise<string[]> {
  const unique = [
    ...new Set(tagIdsOrNames.map((id) => id.trim()).filter((id) => id.length > 0)),
  ];
  if (unique.length === 0) return [];

  const byId = await tagRepository.findTagsByIds(unique);
  if (byId.length === unique.length) {
    return byId.map((t) => t.id);
  }

  const byName = await tagRepository.findTagsByNames(unique);
  if (byName.length !== unique.length) {
    throw new InvalidTagIdsError();
  }
  return byName.map((t) => t.id);
}

export async function createRequest(input: CreateRequestInput) {
  if (!input.title || !input.description) {
    throw new Error("Title and description are required");
  }

  if (input.difficulty < 1 || input.difficulty > 5) {
    throw new Error("Difficulty must be between 1 and 5");
  }

  if (input.basePoints < 0) {
    throw new Error("Base points must be 0 or greater");
  }

  if (input.participantsNeeded < 1) {
    throw new Error("At least 1 participant is required");
  }

  if (!input.tagIds?.length) {
    throw new Error("At least one tag is required");
  }

  // For ASESORIA type, force participantsNeeded to 1
  if (input.type === "ASESORIA" && input.participantsNeeded !== 1) {
    input.participantsNeeded = 1;
  }

  // Validate max 5 requests per user
  const userRequestCount = await requestsRepository.getUserRequestCount(
    input.creatorId,
  );
  if (userRequestCount >= 5) {
    throw new Error("Users can have a maximum of 5 active requests");
  }

  const tagIds = await resolveTagIds(input.tagIds);

  return requestsRepository.createRequest({ ...input, tagIds });
}

/**
 * Auto-expiración perezosa: cada vez que se lee la lista o un detalle de
 * requests, marcamos como vencidos los que ya superaron su `deadline`:
 *
 *   - ABIERTA / EN_REVISION (sin postulantes aceptados suficientes) → CANCELADA
 *   - EN_PROCESO (con postulantes aceptados) → COMPLETADA (habilita ratings)
 *
 * Es barato (dos updateMany por llamada, transaccional) y no requiere
 * infraestructura de cron. Si en el futuro se quiere precisión a nivel de
 * segundos, se puede agregar un job adicional que llame esta misma función.
 */
export async function expireOverdueRequests(): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.request.updateMany({
      where: {
        deadline: { lt: now },
        isExpired: false,
        status: { in: ["EN_PROCESO"] },
      },
      data: { status: "COMPLETADA", isExpired: true },
    }),
    prisma.request.updateMany({
      where: {
        deadline: { lt: now },
        isExpired: false,
        status: { in: ["ABIERTA", "EN_REVISION"] },
      },
      data: { status: "CANCELADA", isExpired: true },
    }),
  ]);
}

export async function getRequests(filters?: {
  type?: RequestType;
  status?: RequestStatus;
  creatorId?: string;
}) {
  await expireOverdueRequests();
  return requestsRepository.getRequests(filters);
}

export async function getRequestById(id: string) {
  await expireOverdueRequests();
  const request = await requestsRepository.getRequestById(id);
  if (!request) {
    throw new Error("Request not found");
  }
  return request;
}

/**
 * Aplaza el deadline de un request. Solo el dueño puede hacerlo y solo si el
 * request sigue activo (no cancelado ni completado). El nuevo deadline debe ser
 * estrictamente mayor que el actual y posterior a "ahora".
 */
export async function extendDeadline(
  id: string,
  newDeadline: Date,
): Promise<ReturnType<typeof requestsRepository.updateRequest>> {
  const request = await requestsRepository.getRequestById(id);
  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status === "CANCELADA" || request.status === "COMPLETADA") {
    throw new Error(
      "No puedes aplazar una solicitud cancelada o completada",
    );
  }

  if (request.isExpired) {
    throw new Error(
      "Esta solicitud ya venció y no puede aplazarse; crea una nueva",
    );
  }

  const now = new Date();
  if (newDeadline <= now) {
    throw new Error("La nueva fecha debe ser posterior a hoy");
  }

  if (request.deadline && newDeadline <= request.deadline) {
    throw new Error(
      "La nueva fecha debe ser posterior al deadline actual",
    );
  }

  return requestsRepository.updateRequest(id, { deadline: newDeadline });
}

export async function updateRequest(id: string, input: UpdateRequestInput) {
  const request = await requestsRepository.getRequestById(id);
  if (!request) {
    throw new Error("Request not found");
  }

  if (input.difficulty !== undefined) {
    if (input.difficulty < 1 || input.difficulty > 5) {
      throw new Error("Difficulty must be between 1 and 5");
    }
  }

  if (input.basePoints !== undefined) {
    if (input.basePoints < 0) {
      throw new Error("Base points must be greater than 0");
    }
  }

  if (input.participantsNeeded !== undefined) {
    if (input.participantsNeeded < 1) {
      throw new Error("At least 1 participant is required");
    }
    // For ASESORIA type, ensure participantsNeeded is 1
    if (request.type === "ASESORIA" && input.participantsNeeded !== 1) {
      input.participantsNeeded = 1;
    }
  }

  let tagIds: string[] | undefined = undefined;
  if (input.tagIds !== undefined) {
    if (input.tagIds.length === 0) {
      throw new Error("At least one tag is required");
    }
    tagIds = await resolveTagIds(input.tagIds);
  }

  return requestsRepository.updateRequest(id, { ...input, tagIds });
}

export async function deleteRequest(id: string) {
  const request = await requestsRepository.getRequestById(id);
  if (!request) {
    throw new Error("Request not found");
  }

  return requestsRepository.deleteRequest(id);
}
