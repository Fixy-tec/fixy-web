import prisma from "../../../prisma";
import { ApplicationStatus } from "@prisma/client";

export interface CreateApplicationInput {
  requestId: string;
  applicantId: string;
  message: string;
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus;
  message?: string;
}

export async function createApplication(data: CreateApplicationInput) {
  return prisma.application.create({
    data: {
      requestId: data.requestId,
      applicantId: data.applicantId,
      message: data.message,
      status: "PENDIENTE",
    },
    include: {
      request: { include: { creator: { include: { profile: true } } } },
      applicant: { include: { profile: true } },
    },
  });
}

export async function getApplications(filters?: {
  requestId?: string;
  applicantId?: string;
  status?: ApplicationStatus;
}) {
  return prisma.application.findMany({
    where: {
      requestId: filters?.requestId,
      applicantId: filters?.applicantId,
      status: filters?.status,
    },
    include: {
      request: { include: { creator: { include: { profile: true } } } },
      applicant: { include: { profile: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplicationById(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      request: { include: { creator: { include: { profile: true } } } },
      applicant: { include: { profile: true } },
      ratings: true,
    },
  });
}

export async function updateApplication(id: string, data: UpdateApplicationInput) {
  const updateData: any = {
    status: data.status,
    message: data.message,
  };

  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  return prisma.application.update({
    where: { id },
    data: updateData,
    include: {
      request: { include: { creator: { include: { profile: true } } } },
      applicant: { include: { profile: true } },
    },
  });
}

export async function deleteApplication(id: string) {
  return prisma.application.delete({
    where: { id },
  });
}

export async function getApplicationByRequestAndApplicant(
  requestId: string,
  applicantId: string
) {
  return prisma.application.findUnique({
    where: {
      requestId_applicantId: {
        requestId,
        applicantId,
      },
    },
  });
}

/**
 * Obtener conteo de aplicaciones aceptadas para un request
 */
export async function getAcceptedApplicationsCount(requestId: string): Promise<number> {
  return prisma.application.count({
    where: {
      requestId,
      status: "ACEPTADA",
    },
  });
}

/**
 * Obtener todas las aplicaciones aceptadas de un request
 */
export async function getAcceptedApplications(requestId: string) {
  return prisma.application.findMany({
    where: {
      requestId,
      status: "ACEPTADA",
    },
    include: {
      request: { include: { creator: { include: { profile: true } } } },
      applicant: { include: { profile: true } },
      ratings: true,
    },
  });
}

/**
 * Verificar si un request necesita más aplicantes
 */
export async function hasCapacityForMoreApplications(requestId: string): Promise<boolean> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { participantsNeeded: true },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  const acceptedCount = await getAcceptedApplicationsCount(requestId);
  return acceptedCount < request.participantsNeeded;
}
