import * as applicationsRepository from "../repositories/applications.repository";
import { ApplicationStatus } from "@prisma/client";

interface CreateApplicationInput {
  requestId: string;
  applicantId: string;
  message: string;
}

interface UpdateApplicationInput {
  status?: ApplicationStatus;
  message?: string;
}

export async function createApplication(input: CreateApplicationInput) {
  if (!input.requestId || !input.applicantId || !input.message) {
    throw new Error("RequestId, applicantId and message are required");
  }

  if (input.message.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  // Check if already applied
  const existing = await applicationsRepository.getApplicationByRequestAndApplicant(
    input.requestId,
    input.applicantId
  );

  if (existing) {
    throw new Error("You have already applied to this request");
  }

  return applicationsRepository.createApplication(input);
}

export async function getApplications(filters?: {
  requestId?: string;
  applicantId?: string;
  status?: ApplicationStatus;
}) {
  return applicationsRepository.getApplications(filters);
}

export async function getApplicationById(id: string) {
  const application = await applicationsRepository.getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }
  return application;
}

export async function updateApplication(id: string, input: UpdateApplicationInput) {
  const application = await applicationsRepository.getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }

  if (input.message !== undefined && input.message.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  return applicationsRepository.updateApplication(id, input);
}

export async function deleteApplication(id: string) {
  const application = await applicationsRepository.getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }

  return applicationsRepository.deleteApplication(id);
}
