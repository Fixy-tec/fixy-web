import { Role, User } from "@prisma/client";
import { signJwt } from "../../../utils/jwt";
import {
  getGoogleOAuthClient,
  getGoogleRedirectUri,
} from "../config/google.oauth";
import {
  getInstitutionForEmail,
  INSTITUTIONAL_REJECTION_MESSAGE,
  validateInstitutionalEmail,
} from "../constants/auth.constants";
import * as authRepository from "../repositories/auth.repository";
import { notifyAdminDashboardUpdate } from "../../../realtime/admin.realtime";

export class InstitutionalEmailRejectedError extends Error {
  constructor() {
    super(INSTITUTIONAL_REJECTION_MESSAGE);
    this.name = "InstitutionalEmailRejectedError";
  }
}

export class AccountDisabledError extends Error {
  constructor() {
    super("Account is disabled");
    this.name = "AccountDisabledError";
  }
}

export class GoogleAuthError extends Error {
  constructor(message = "Error al autenticar con Google") {
    super(message);
    this.name = "GoogleAuthError";
  }
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  profileCompleted: boolean;
  institution: string | null;
}

export interface AuthTokenResult {
  user: AuthUserDto;
  accessToken: string;
}

function sanitizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Estudiante";
  return trimmed.slice(0, 80);
}

function toAuthUserDto(user: User): AuthUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileCompleted: user.profileCompleted,
    institution: user.institution,
  };
}

export function generateTokens(user: User): string {
  return signJwt({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}

export function getGoogleAuthUrl(): string {
  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    redirect_uri: getGoogleRedirectUri(),
  });
}

export async function handleGoogleCallback(code: string): Promise<AuthTokenResult> {
  const client = getGoogleOAuthClient();

  let tokens;
  try {
    const result = await client.getToken({ code, redirect_uri: getGoogleRedirectUri() });
    tokens = result.tokens;
  } catch {
    throw new GoogleAuthError("No se pudo intercambiar el código de autorización");
  }

  if (!tokens.id_token) {
    throw new GoogleAuthError("Google no devolvió un token de identidad");
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new GoogleAuthError("Respuesta de Google incompleta");
  }

  const email = payload.email.toLowerCase().trim();
  const googleId = payload.sub;
  const name = sanitizeName(payload.name ?? email.split("@")[0]);

  if (!validateInstitutionalEmail(email)) {
    throw new InstitutionalEmailRejectedError();
  }

  const user = await createOrLoginGoogleUser({ googleId, email, name });
  const accessToken = generateTokens(user);

  return {
    user: toAuthUserDto(user),
    accessToken,
  };
}

async function createOrLoginGoogleUser(input: {
  googleId: string;
  email: string;
  name: string;
}): Promise<User> {
  const institution = getInstitutionForEmail(input.email);

  let user =
    (await authRepository.findByGoogleId(input.googleId)) ??
    (await authRepository.findByEmail(input.email));

  if (user) {
    if (!user.isActive) {
      throw new AccountDisabledError();
    }

    if (!user.googleId) {
      user = await authRepository.updateGoogleData(user.id, {
        googleId: input.googleId,
        name: input.name,
      });
    }

  } else {
    user = await authRepository.createGoogleUser({
      email: input.email,
      name: input.name,
      googleId: input.googleId,
      institution,
      role: Role.USER,
    });
    void notifyAdminDashboardUpdate();
  }

  return user;
}

export async function validateSession(userId: string): Promise<AuthUserDto | null> {
  const user = await authRepository.findById(userId);
  if (!user || !user.isActive) return null;
  return toAuthUserDto(user);
}
