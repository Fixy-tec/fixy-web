import prisma from "../../../prisma";
import { Prisma } from "@prisma/client";
import * as userRepository from "../repositories/user.repository";
import * as tagRepository from "../../tags/repositories/tag.repository";

function toPublicUser<T extends { password?: string }>(user: T | null) {
  if (!user) return null;
  const { password: _pw, ...rest } = user as T & { password?: string };
  return rest;
}

export async function getUsers() {
  return userRepository.getUsers();
}

export async function getUserById(id: string) {
  return userRepository.getUserById(id);
}

async function attachUserStats<T extends { id: string }>(user: T) {
  const completedRequests = await prisma.request.count({
    where: { creatorId: user.id, status: "COMPLETADA" },
  });
  return {
    ...user,
    stats: { completedRequests },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await userRepository.getUserWithProfile(userId);
  const publicUser = toPublicUser(user);
  if (!publicUser) return null;
  return attachUserStats(publicUser);
}

export class InvalidTagNamesError extends Error {
  constructor() {
    super("Uno o más tags no existen en el catálogo");
    this.name = "InvalidTagNamesError";
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super("Ese nombre de usuario ya está en uso");
    this.name = "UsernameTakenError";
  }
}

export async function updateCurrentUser(userId: string, data: {
  name?: string;
  avatarUrl?: string;
  whatsapp: string;  // Required to match schema validation
  bio?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  tags?: string[];
}) {
  let tagIds: string[] | undefined = undefined;
  if (data.tags !== undefined) {
    const uniqueNames = [
      ...new Set(
        data.tags.map((t) => t.trim()).filter((t) => t.length > 0),
      ),
    ];
    if (uniqueNames.length === 0) {
      tagIds = [];
    } else {
      const found = await tagRepository.findTagsByNames(uniqueNames);
      if (found.length !== uniqueNames.length) {
        throw new InvalidTagNamesError();
      }
      tagIds = found.map((t) => t.id);
    }
  }

  // Si se intenta cambiar el nombre, verificamos duplicados explícitamente
  // (la BD no marca `name` como @unique en User, pero queremos evitar choques).
  if (data.name !== undefined) {
    const taken = await prisma.user.findFirst({
      where: { name: data.name, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) throw new UsernameTakenError();
  }

  try {
    const updated = await userRepository.updateUserProfile(userId, {
      name: data.name,
      avatarUrl: data.avatarUrl,
      whatsapp: data.whatsapp,
      bio: data.bio,
      portfolioUrl: data.portfolioUrl,
      linkedinUrl: data.linkedinUrl,
      githubUrl: data.githubUrl,
      tagIds,
    });
    const publicUser = toPublicUser(updated);
    if (!publicUser) return null;
    return attachUserStats(publicUser);
  } catch (error) {
    // Por si en el futuro se marca `User.name` como @unique
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new UsernameTakenError();
    }
    throw error;
  }
}
