import prisma from "../prisma";

interface CreateApplicationInput {
  requestId: string;
  applicantId: string;
  message: string;
}

export async function getApplications() {
  return prisma.application.findMany({
    include: {
      applicant: true,
      request: true,
    },
  });
}

export async function createApplication(data: CreateApplicationInput) {
  return prisma.application.create({
    data,
  });
}
