import { comparePassword, hashPassword } from "../../../utils/password";
import { signJwt } from "../../../utils/jwt";
import * as authRepository from "../repositories/auth.repository";
import { Role, User } from "@prisma/client";

interface RegisterInput {
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput) {
  const existingUser = await authRepository.findUserByEmail(input.email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await hashPassword(input.password);
  const user = await authRepository.createUser({
    email: input.email,
    password: hashedPassword,
    role: Role.USER,
  });

  const accessToken = signJwt({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: sanitizeUser(user), accessToken };
}

export async function login(input: LoginInput) {
  const user = await authRepository.findUserByEmail(input.email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const passwordMatch = await comparePassword(input.password, user.password);
  if (!passwordMatch) {
    throw new Error("Invalid credentials");
  }

  const accessToken = signJwt({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: sanitizeUser(user), accessToken };
}

function sanitizeUser(user: User & { profile: any; userTags: any }) {
  const { password, ...rest } = user as any;
  return {
    ...rest,
    tags: user.userTags?.map((userTag: any) => userTag.tag.name) ?? [],
  };
}
