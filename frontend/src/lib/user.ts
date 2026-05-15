const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const DEFAULT_AVATAR_PATHS = [
  "/avatars/fixoArte.png",
  "/avatars/fixoCyborg.png",
  "/avatars/fixoHacker.png",
  "/avatars/fixoKarate.png",
  "/avatars/fixoMoney.png",
  "/avatars/fixoPirata.png",
] as const;

export interface ProfileDto {
  id: string;
  userId: string;
  institution: string | null;
  career: string | null;
  cycle: number | null;
  bio: string | null;
  avatarUrl: string | null;
  whatsapp: string;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  avgRating: number;
}

export interface UserTagDto {
  userId: string;
  tagId: string;
  assignedAt: string;
  tag: { id: string; name: string; isCustom: boolean };
}

export interface CurrentUserDto {
  id: string;
  name: string;
  email: string;
  password?: never;
  isActive: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  points: number;
  medal: string;
  profile: ProfileDto | null;
  userTags: UserTagDto[];
}

export interface CurrentUserResponse {
  user: CurrentUserDto;
}

export interface UpdateCurrentUserPayload {
  avatarUrl?: string;
  whatsapp: string;
  bio?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  /** Nombres exactos de tags existentes en BD (tabla Tag) */
  tags: string[];
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * URL absoluta del avatar para guardar en `Profile.avatarUrl`
 * (imágenes estáticas servidas por el mismo origen del front).
 */
export function toAbsoluteProfileImageUrl(
  publicPath: string,
  origin?: string,
): string {
  const base =
    origin ??
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  const path = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
  return `${base}${path}`;
}

/** Normaliza número peruano a formato internacional +51… */
export function normalizePeWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("51")) {
    return `+${digits}`;
  }
  return `+51${digits}`;
}

export async function fetchCurrentUser(
  token: string,
): Promise<CurrentUserDto> {
  const response = await fetch(`${API_BASE}/users/me`, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ?? "Error al obtener perfil",
    );
  }

  const body = (await response.json()) as CurrentUserResponse;
  return body.user;
}

export async function updateCurrentUser(
  token: string,
  payload: UpdateCurrentUserPayload,
): Promise<CurrentUserDto> {
  const response = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({
      avatarUrl: payload.avatarUrl,
      whatsapp: payload.whatsapp,
      bio: payload.bio,
      portfolioUrl: payload.portfolioUrl,
      linkedinUrl: payload.linkedinUrl,
      githubUrl: payload.githubUrl,
      tags: payload.tags,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ?? "Error al actualizar perfil",
    );
  }

  const body = (await response.json()) as CurrentUserResponse;
  return body.user;
}
