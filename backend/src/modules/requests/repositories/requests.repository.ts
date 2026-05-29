import prisma from "../../../prisma";
import { RequestType, RequestStatus } from "@prisma/client";

export interface CreateRequestInput {
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

export interface UpdateRequestInput {
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

export async function createRequest(data: CreateRequestInput) {
  return prisma.request.create({
    data: {
      creatorId: data.creatorId,
      type: data.type,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      basePoints: data.basePoints,
      economicBenefit: data.economicBenefit,
      participantsNeeded: data.participantsNeeded,
      deadline: data.deadline,
      tags: {
        create: data.tags.map((tag) => ({
          tag: {
            connectOrCreate: {
              where: { name: tag },
              create: { name: tag },
            },
          },
        })),
      },
    },
    include: {
      creator: { include: { profile: true } },
      tags: { include: { tag: true } },
      applications: true,
    },
  });
}

export async function getRequests(filters?: {
  type?: RequestType;
  status?: RequestStatus;
  creatorId?: string;
}) {
  return prisma.request.findMany({
    where: {
      type: filters?.type,
      status: filters?.status,
      creatorId: filters?.creatorId,
    },
    include: {
      creator: { include: { profile: true } },
      tags: { include: { tag: true } },
      applications: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRequestById(id: string) {
  return prisma.request.findUnique({
    where: { id },
    include: {
      creator: { include: { profile: true } },
      tags: { include: { tag: true } },
      applications: {
        include: { applicant: { include: { profile: true } } },
      },
    },
  });
}

export async function updateRequest(id: string, data: UpdateRequestInput) {
  const updateData: any = {
    type: data.type,
    title: data.title,
    description: data.description,
    difficulty: data.difficulty,
    basePoints: data.basePoints,
    economicBenefit: data.economicBenefit,
    participantsNeeded: data.participantsNeeded,
    deadline: data.deadline,
    status: data.status,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  if (data.tags) {
    updateData.tags = {
      deleteMany: {},
      create: data.tags.map((tag) => ({
        tag: {
          connectOrCreate: {
            where: { name: tag },
            create: { name: tag },
          },
        },
      })),
    };
  }

  return prisma.request.update({
    where: { id },
    data: updateData,
    include: {
      creator: { include: { profile: true } },
      tags: { include: { tag: true } },
      applications: true,
    },
  });
}

export async function deleteRequest(id: string) {
  return prisma.request.delete({
    where: { id },
  });
}

export async function getUserRequestCount(userId: string): Promise<number> {
  return prisma.request.count({
    where: {
      creatorId: userId,
      status: {
        in: ["ABIERTA", "EN_REVISION", "EN_PROCESO"],
      },
    },
  });
}
