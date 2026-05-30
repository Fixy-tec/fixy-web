import prisma from "../../../prisma";

export interface CreateRatingInput {
  applicationId: string;
  raterId: string;
  ratedId: string;
  stars: number;
  comment?: string;
}

export interface UpdateRatingInput {
  stars?: number;
  comment?: string;
}

export async function createRating(data: CreateRatingInput) {
  return prisma.rating.create({
    data: {
      applicationId: data.applicationId,
      raterId: data.raterId,
      ratedId: data.ratedId,
      stars: data.stars,
      comment: data.comment,
    },
    include: {
      rater: { include: { profile: true } },
      rated: { include: { profile: true } },
      application: {
        include: {
          request: true,
          applicant: { include: { profile: true } },
        },
      },
    },
  });
}

export async function getRating(id: string) {
  return prisma.rating.findUnique({
    where: { id },
    include: {
      rater: { include: { profile: true } },
      rated: { include: { profile: true } },
      application: {
        include: {
          request: true,
          applicant: { include: { profile: true } },
        },
      },
    },
  });
}

export async function getRatingsByApplicationId(applicationId: string) {
  return prisma.rating.findMany({
    where: { applicationId },
    include: {
      rater: true,
      rated: true,
    },
  });
}


export async function getRatingsByRatedUser(userId: string) {
  return prisma.rating.findMany({
    where: { ratedId: userId },
    include: {
      rater: { include: { profile: true } },
      application: {
        include: {
          request: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateRating(id: string, data: UpdateRatingInput) {
  const updateData: any = {
    stars: data.stars,
    comment: data.comment,
  };

  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  return prisma.rating.update({
    where: { id },
    data: updateData,
    include: {
      rater: { include: { profile: true } },
      rated: { include: { profile: true } },
      application: {
        include: {
          request: true,
          applicant: { include: { profile: true } },
        },
      },
    },
  });
}

export async function deleteRating(id: string) {
  return prisma.rating.delete({
    where: { id },
  });
}

export async function getApplicationForRating(applicationId: string) {
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      request: {
        include: { creator: true },
      },
    },
  });
}

export async function getRatingsByApplication(applicationId: string) {
  return prisma.rating.findMany({
    where: { applicationId },
  });
}

export async function getRatingByApplicationAndRater(
  applicationId: string,
  raterId: string
) {
  return prisma.rating.findFirst({
    where: {
      applicationId,
      raterId,
    },
  });
}
