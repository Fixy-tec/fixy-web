import prisma from "../../../prisma";
import { Role } from "@prisma/client";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      userTags: { include: { tag: true } },
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      userTags: { include: { tag: true } },
    },
  });
}

export async function createUser(data: CreateUserInput) {
  return prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role ?? Role.USER,
    },
    include: {
      profile: true,
      userTags: { include: { tag: true } },
    },
  });
}
