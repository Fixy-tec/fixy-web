const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * POST `/auth/register` — body: `{ name, email, password }`
 */
export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Error al registrarse";
    try {
      const error = (await response.json()) as { message?: string };
      if (error?.message) message = String(error.message);
    } catch {
      /* cuerpo no JSON */
    }
    throw new Error(message);
  }

  return response.json();
}

/** POST `/auth/login` — body: `{ email, password }` */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Credenciales inválidas";
    try {
      const error = (await response.json()) as { message?: string };
      if (error?.message) message = String(error.message);
    } catch {
      /* cuerpo no JSON */
    }
    throw new Error(message);
  }

  return response.json();
}

/** POST `/auth/logout` — header `Authorization: Bearer <accessToken>` */
export async function logoutUser(accessToken: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export const AUTH_TOKEN_KEY = "auth_token";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function setAuthCookie(token: string) {
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Verifica si hay token válido en localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Guarda el token en localStorage y cookie (para middleware)
 */
export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  setAuthCookie(token);
}

/**
 * Elimina el token de localStorage y cookie
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  clearAuthCookie();
}

/** Sincroniza cookie desde localStorage (sesiones previas al middleware) */
export function syncAuthCookieFromStorage(): void {
  if (typeof window === "undefined") return;
  const token = getStoredToken();
  if (token && isTokenValid(token)) {
    setAuthCookie(token);
  } else {
    clearAuthCookie();
  }
}

/**
 * Decodifica el JWT para obtener el payload (sin verificar firma)
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica si el token es válido (no expirado)
 */
export function isTokenValid(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now;
}
