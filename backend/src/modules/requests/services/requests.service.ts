import * as requestsRepository from "../repositories/requests.repository";
import * as tagRepository from "../../tags/repositories/tag.repository";
import { RequestType, RequestStatus } from "@prisma/client";

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
    throw new Error("Base points must be greater than 0");
  }

  if (input.participantsNeeded < 1) {
    throw new Error("At least 1 participant is required");
  }

  if (!input.tagIds?.length) {
    throw new Error("At least one tag is required");
  }

  const userRequestCount = await requestsRepository.getUserRequestCount(
    input.creatorId,
  );
  if (userRequestCount >= 5) {
    throw new Error("Users can have a maximum of 5 active requests");
  }

  const tagIds = await resolveTagIds(input.tagIds);

  return requestsRepository.createRequest({ ...input, tagIds });
}

export async function getRequests(filters?: {
  type?: RequestType;
  status?: RequestStatus;
  creatorId?: string;
}) {
  return requestsRepository.getRequests(filters);
}

export async function getRequestById(id: string) {
  const request = await requestsRepository.getRequestById(id);
  if (!request) {
    throw new Error("Request not found");
  }
  return request;
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
