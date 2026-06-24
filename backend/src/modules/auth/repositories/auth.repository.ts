import prisma from "../../../prisma";
import { Role } from "@prisma/client";

export interface CreateGoogleUserInput {
  email: string;
  name: string;
  googleId: string;
  institution?: string;
  role?: Role;
}

const userInclude = {
  profile: true,
  userTags: { include: { tag: true } },
} as const;

export async function findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: userInclude,
  });
}

/** @deprecated Usar findByEmail */
export const findUserByEmail = findByEmail;

export async function findByGoogleId(googleId: string) {
  return prisma.user.findUnique({
    where: { googleId },
    include: userInclude,
  });
}

export async function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });
}

/** @deprecated Usar findById */
export const findUserById = findById;

export async function createGoogleUser(data: CreateGoogleUserInput) {
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      name: data.name,
      googleId: data.googleId,
      role: data.role ?? Role.USER,
      institution: data.institution ?? "TECSUP",
      profileCompleted: false,
    },
    include: userInclude,
  });
}

export async function updateGoogleData(
  userId: string,
  data: { googleId: string; name?: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      googleId: data.googleId,
      ...(data.name ? { name: data.name } : {}),
    },
    include: userInclude,
  });
}

export async function markProfileCompleted(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { profileCompleted: true },
    include: userInclude,
  });
}
