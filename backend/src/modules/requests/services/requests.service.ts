import * as requestsRepository from "../repositories/requests.repository";
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
  tags: string[];
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
  tags?: string[];
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

  // Validate max 5 requests per user
  const userRequestCount = await requestsRepository.getUserRequestCount(input.creatorId);
  if (userRequestCount >= 5) {
    throw new Error("Users can have a maximum of 5 active requests");
  }

  return requestsRepository.createRequest(input);
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

  return requestsRepository.updateRequest(id, input);
}

export async function deleteRequest(id: string) {
  const request = await requestsRepository.getRequestById(id);
  if (!request) {
    throw new Error("Request not found");
  }

  return requestsRepository.deleteRequest(id);
}
