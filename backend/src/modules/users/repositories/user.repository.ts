import prisma from "../../../prisma";

export async function getUsers() {
  return prisma.user.findMany({
    include: {
      profile: true,
      userTags: { include: { tag: true } },
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      userTags: { include: { tag: true } },
    },
  });
}

export async function getUserWithProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userTags: { include: { tag: true } },
    },
  });
}

export async function updateUserProfile(userId: string, data: {
  /** User.name (único en BD) — opcional para no forzar renombrado */
  name?: string;
  avatarUrl?: string;
  whatsapp: string;  // Required to match schema validation
  bio?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  /** Resolved tag UUIDs from DB; undefined = leave tags unchanged, [] = clear all */
  tagIds?: string[];
}) {
  const profileData = {
    avatarUrl: data.avatarUrl,
    whatsapp: data.whatsapp,
    bio: data.bio,
    portfolioUrl: data.portfolioUrl,
    linkedinUrl: data.linkedinUrl,
    githubUrl: data.githubUrl,
  };

  const tagUpdates =
    data.tagIds !== undefined
      ? {
          deleteMany: {},
          create: data.tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        }
      : undefined;

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      profile: {
        upsert: {
          create: profileData as any,
          update: profileData,
        },
      },
      userTags: tagUpdates,
    },
    include: {
      profile: true,
      userTags: { include: { tag: true } },
    },
  });
}
