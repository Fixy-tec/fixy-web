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
      rating: true,
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
