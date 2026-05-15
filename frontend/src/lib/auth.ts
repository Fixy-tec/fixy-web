const API_BASE = "http://localhost:4000/api";

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
 * Registra un nuevo usuario
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
    const error = await response.json();
    throw new Error(error.message || "Error al registrarse");
  }

  return response.json();
}

/**
 * Inicia sesión con email y password
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Credenciales inválidas");
  }

  return response.json();
}

/**
 * Verifica si hay token válido en localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

/**
 * Guarda el token en localStorage
 */
export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
}

/**
 * Elimina el token de localStorage
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
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
