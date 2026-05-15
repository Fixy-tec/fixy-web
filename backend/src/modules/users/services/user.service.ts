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

export async function getCurrentUser(userId: string) {
  const user = await userRepository.getUserWithProfile(userId);
  return toPublicUser(user);
}

export class InvalidTagNamesError extends Error {
  constructor() {
    super("Uno o más tags no existen en el catálogo");
    this.name = "InvalidTagNamesError";
  }
}

export async function updateCurrentUser(userId: string, data: {
  avatarUrl?: string;
  whatsapp: string;
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

  const updated = await userRepository.updateUserProfile(userId, {
    avatarUrl: data.avatarUrl,
    whatsapp: data.whatsapp,
    bio: data.bio,
    portfolioUrl: data.portfolioUrl,
    linkedinUrl: data.linkedinUrl,
    githubUrl: data.githubUrl,
    tagIds,
  });
  return toPublicUser(updated);
}
