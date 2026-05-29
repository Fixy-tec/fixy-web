import { HttpError } from "@/src/lib/httpError";
import { getMedalByPoints, type Medal } from "@/src/lib/medals";
import type { UserProfile } from "@/src/views/userProfileView";

const MEDAL_FROM_API: Record<string, Medal> = {
  HIERRO: "Hierro",
  BRONCE: "Bronce",
  PLATA: "Plata",
  ORO: "Oro",
  DIAMANTE: "Diamante",
  MAESTRO: "Maestro",
  CHALLENGER: "Challenger",
};

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

export interface UserStatsDto {
  completedRequests: number;
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
  stats?: UserStatsDto;
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

export async function fetchUserById(
  token: string,
  userId: string,
): Promise<CurrentUserDto> {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      (error as { message?: string }).message ?? "Error al obtener usuario";
    throw new HttpError(response.status, message);
  }

  const body = (await response.json()) as CurrentUserResponse;
  return body.user;
}

export function mapMedalFromApi(apiMedal: string, points: number): Medal {
  return MEDAL_FROM_API[apiMedal.toUpperCase()] ?? getMedalByPoints(points).name;
}

export function resolveAvatarUrl(avatarUrl: string | null | undefined): string {
  if (!avatarUrl?.trim()) return DEFAULT_AVATAR_PATHS[0];
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("/")) return avatarUrl;
  return DEFAULT_AVATAR_PATHS[0];
}

/** Muestra WhatsApp en formato local (+51 999…) */
export function formatWhatsappDisplay(whatsapp: string | undefined): string {
  if (!whatsapp) return "";
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length > 2) {
    return digits.slice(2);
  }
  return digits;
}

function formatCarrera(profile: ProfileDto | null): string {
  if (!profile) return "—";
  const parts: string[] = [];
  if (profile.career?.trim()) parts.push(profile.career.trim());
  if (profile.institution?.trim()) parts.push(profile.institution.trim());
  if (profile.cycle != null) parts.push(`Ciclo ${profile.cycle}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function mapUserDtoToProfile(user: CurrentUserDto): UserProfile {
  const points = user.points ?? 0;
  const medal = mapMedalFromApi(user.medal, points);

  return {
    id: user.id,
    name: user.name,
    carrera: formatCarrera(user.profile),
    avatar: resolveAvatarUrl(user.profile?.avatarUrl),
    points,
    medal,
    ranking: 0,
    rating: Number(user.profile?.avgRating ?? 0),
    completadas: user.stats?.completedRequests ?? 0,
    bio: user.profile?.bio?.trim() || undefined,
    whatsapp: formatWhatsappDisplay(user.profile?.whatsapp),
    tags: user.userTags?.map((ut) => ut.tag.name) ?? [],
    github: user.profile?.githubUrl?.trim() || undefined,
    linkedin: user.profile?.linkedinUrl?.trim() || undefined,
    portfolio: user.profile?.portfolioUrl?.trim() || undefined,
  };
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
