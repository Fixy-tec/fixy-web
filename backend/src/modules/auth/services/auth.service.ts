import { randomUUID } from "crypto";
import { PlanType, Role, User } from "@prisma/client";
import { signJwt } from "../../../utils/jwt";
import { comparePassword, hashPassword } from "../../../utils/password";
import {
  getGoogleOAuthClient,
  getGoogleRedirectUri,
} from "../config/google.oauth";
import { getInstitutionForEmail } from "../constants/auth.constants";
import * as authRepository from "../repositories/auth.repository";
import { notifyAdminDashboardUpdate } from "../../../realtime/admin.realtime";
import { effectivePlan, isProActive } from "../../plans/plan.utils";
import type { LoginInput, RegisterInput } from "../../../validators/auth.schema";

export class AccountDisabledError extends Error {
  constructor() {
    super("Tu cuenta está desactivada. Contacta a un administrador.");
    this.name = "AccountDisabledError";
  }
}

export class GoogleAuthError extends Error {
  constructor(message = "Error al autenticar con Google") {
    super(message);
    this.name = "GoogleAuthError";
  }
}

export class EmailTakenError extends Error {
  constructor() {
    super("Ya existe una cuenta con ese correo. Inicia sesión.");
    this.name = "EmailTakenError";
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super("Ese nombre de usuario ya está en uso");
    this.name = "UsernameTakenError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Correo o contraseña incorrectos");
    this.name = "InvalidCredentialsError";
  }
}

export class GoogleOnlyAccountError extends Error {
  constructor() {
    super("Esta cuenta se creó con Google. Usa «Continuar con Google».");
    this.name = "GoogleOnlyAccountError";
  }
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  profileCompleted: boolean;
  institution: string | null;
  plan: PlanType;
  isPro: boolean;
  planExpiresAt: Date | null;
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
  const isPro = isProActive(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileCompleted: user.profileCompleted,
    institution: user.institution,
    plan: effectivePlan(user),
    isPro,
    planExpiresAt: isPro ? user.planExpiresAt : null,
  };
}

export function generateTokens(user: User): string {
  return signJwt({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}

function toTokenResult(user: User): AuthTokenResult {
  return { user: toAuthUserDto(user), accessToken: generateTokens(user) };
}

// ── Correo + contraseña ────────────────────────────────────────────────────

export async function registerWithPassword(input: RegisterInput): Promise<AuthTokenResult> {
  if (await authRepository.findByEmail(input.email)) {
    throw new EmailTakenError();
  }
  if (await authRepository.isUsernameTaken(input.name)) {
    throw new UsernameTakenError();
  }

  const user = await authRepository.createPasswordUser({
    email: input.email,
    name: input.name,
    passwordHash: await hashPassword(input.password),
    institution: getInstitutionForEmail(input.email),
  });
  void notifyAdminDashboardUpdate();
  return toTokenResult(user);
}

// Hash real de una contraseña aleatoria: comparar contra él cuando el correo
// no existe hace que ambas respuestas tarden lo mismo (no se filtra si existe).
let dummyHash: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomUUID());
  return dummyHash;
}

export async function loginWithPassword(input: LoginInput): Promise<AuthTokenResult> {
  const user = await authRepository.findByEmail(input.email);

  if (!user) {
    await comparePassword(input.password, await getDummyHash());
    throw new InvalidCredentialsError();
  }
  if (!user.password) {
    throw new GoogleOnlyAccountError();
  }
  if (!(await comparePassword(input.password, user.password))) {
    throw new InvalidCredentialsError();
  }
  if (!user.isActive) {
    throw new AccountDisabledError();
  }
  return toTokenResult(user);
}

// ── Google (opcional, se mantiene para las cuentas existentes) ─────────────

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

  const user = await createOrLoginGoogleUser({ googleId, email, name });
  return toTokenResult(user);
}

async function createOrLoginGoogleUser(input: {
  googleId: string;
  email: string;
  name: string;
}): Promise<User> {
  let user =
    (await authRepository.findByGoogleId(input.googleId)) ??
    (await authRepository.findByEmail(input.email));

  if (user) {
    if (!user.isActive) {
      throw new AccountDisabledError();
    }

    // Una cuenta creada con contraseña puede vincular Google con el mismo correo.
    if (!user.googleId) {
      user = await authRepository.updateGoogleData(user.id, {
        googleId: input.googleId,
      });
    }
  } else {
    user = await authRepository.createGoogleUser({
      email: input.email,
      name: input.name,
      googleId: input.googleId,
      institution: getInstitutionForEmail(input.email),
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
