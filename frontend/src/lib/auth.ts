const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profileCompleted: boolean;
  institution?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export const AUTH_TOKEN_KEY = "auth_token";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function setAuthCookie(token: string) {
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/** URL del backend que redirige a Google OAuth */
export function getGoogleLoginUrl(): string {
  return `${API_BASE}/auth/google`;
}

export async function fetchAuthMe(accessToken: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Sesión inválida");
  }

  const body = (await response.json()) as { user: AuthUser };
  return body.user;
}

export async function logoutUser(accessToken: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  setAuthCookie(token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  clearAuthCookie();
}

export function readAuthCookie(): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${AUTH_TOKEN_KEY}=`;
  const cookies = document.cookie.split(";");

  for (const entry of cookies) {
    const trimmed = entry.trim();
    if (trimmed.startsWith(prefix)) {
      const raw = trimmed.slice(prefix.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }

  return null;
}

/** Obtiene el token desde localStorage o cookie (OAuth / sesión previa). */
export function resolveAuthToken(): string | null {
  return getStoredToken() ?? readAuthCookie();
}

export function syncAuthCookieFromStorage(): void {
  if (typeof window === "undefined") return;
  const token = getStoredToken();
  if (token && isTokenValid(token)) {
    setAuthCookie(token);
  } else {
    clearAuthCookie();
  }
}

export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded.exp !== "number") return false;
  return decoded.exp > Math.floor(Date.now() / 1000);
}
