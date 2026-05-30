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

// ── Reglas (alineadas con backend/src/validators/user.schema.ts) ─────────────
export const PROFILE_RULES = {
  WHATSAPP_REGEX: /^(?:\+51)?9\d{8}$/,
  BIO_MIN: 10,
  BIO_MAX: 300,
  BIO_REGEX:
    /^[A-Za-z0-9\s*.,\-/#@!?¿¡\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u,
  BIO_MAX_EMOJIS: 5,
  TAGS_MAX: 5,
} as const;

const EMOJI_REGEX =
  /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

export function isWhatsappValid(input: string): boolean {
  if (!input) return false;
  return PROFILE_RULES.WHATSAPP_REGEX.test(input);
}

/** Devuelve un mensaje de error o `null` si la bio es válida (o vacía/opcional). */
export function validateBio(bio: string | undefined): string | null {
  if (!bio || !bio.trim()) return null;
  const value = bio.trim().replace(/\s+/g, " ");
  if (value.length < PROFILE_RULES.BIO_MIN)
    return `La bio debe tener al menos ${PROFILE_RULES.BIO_MIN} caracteres`;
  if (value.length > PROFILE_RULES.BIO_MAX)
    return `La bio no puede exceder ${PROFILE_RULES.BIO_MAX} caracteres`;
  if (!PROFILE_RULES.BIO_REGEX.test(value))
    return "La bio solo permite letras (A-Z), números y signos básicos (.,-/#@!?¿¡)";
  const emojis = value.match(EMOJI_REGEX);
  if (emojis && emojis.length > PROFILE_RULES.BIO_MAX_EMOJIS)
    return `La bio admite máximo ${PROFILE_RULES.BIO_MAX_EMOJIS} emojis`;
  return null;
}

/** Devuelve mensaje de error o `null` si la URL es válida (o vacía/opcional). */
export function validateOptionalUrl(
  url: string | undefined,
  label: string,
): string | null {
  if (!url || !url.trim()) return null;
  try {
    new URL(url.trim());
    return null;
  } catch {
    return `${label} debe ser una URL válida (incluye https://)`;
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Path público del avatar para guardar en `Profile.avatarUrl`.
 *
 * Guardamos solo el path relativo (`/avatars/fixoPirata.png`) para que:
 *  - Sea portable (no se rompe al cambiar de host).
 *  - Next/Image lo sirva como asset estático local sin pasar por optimización
 *    remota (más rápido y sin requerir `remotePatterns`).
 */
export function toProfileImagePath(publicPath: string): string {
  return publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
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

/**
 * Convierte cualquier `avatarUrl` guardado (path relativo o URL absoluta legacy)
 * a un path que Next.js pueda servir como asset local.
 */
export function resolveAvatarUrl(avatarUrl: string | null | undefined): string {
  const value = avatarUrl?.trim();
  if (!value) return DEFAULT_AVATAR_PATHS[0];

  // Registros antiguos guardados como `http://localhost:3000/avatars/fixoX.png`:
  // extraemos solo el path para servirlo como estático local.
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.pathname || DEFAULT_AVATAR_PATHS[0];
    } catch {
      return DEFAULT_AVATAR_PATHS[0];
    }
  }

  if (value.startsWith("/")) return value;
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
  // Construye el body solo con los campos definidos para evitar enviar
  // strings vacíos a los validadores .url() del backend.
  const body: Record<string, unknown> = {
    whatsapp: payload.whatsapp,
    tagIds: payload.tags,
  };
  if (payload.avatarUrl) body.avatarUrl = payload.avatarUrl;
  if (payload.bio) body.bio = payload.bio;
  if (payload.portfolioUrl) body.portfolioUrl = payload.portfolioUrl;
  if (payload.linkedinUrl) body.linkedinUrl = payload.linkedinUrl;
  if (payload.githubUrl) body.githubUrl = payload.githubUrl;

  const response = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ?? "Error al actualizar perfil",
    );
  }

  const responseBody = (await response.json()) as CurrentUserResponse;
  return responseBody.user;
}
