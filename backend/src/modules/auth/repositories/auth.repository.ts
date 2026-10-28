import prisma from "../../../prisma";
import { Role } from "@prisma/client";

export interface CreateGoogleUserInput {
  email: string;
  name: string;
  googleId: string;
  institution?: string | null;
  role?: Role;
}

export interface CreatePasswordUserInput {
  email: string;
  name: string;
  passwordHash: string;
  institution: string | null;
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
      institution: data.institution ?? null,
      profileCompleted: false,
    },
    include: userInclude,
  });
}

export async function createPasswordUser(data: CreatePasswordUserInput) {
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      name: data.name,
      password: data.passwordHash,
      role: Role.USER,
      institution: data.institution,
      profileCompleted: false,
    },
    include: userInclude,
  });
}

/** El nombre de usuario no es @unique en BD, pero se mantiene único en la app. */
export async function isUsernameTaken(name: string): Promise<boolean> {
  const found = await prisma.user.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  return found !== null;
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
