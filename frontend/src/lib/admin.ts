import { HttpError } from "@/src/lib/httpError";
import type { User } from "@/src/context/AuthContext";
import type { CurrentUserDto } from "@/src/lib/user";
import { fetchUserById } from "@/src/lib/user";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const SOCKET_BASE =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  (API_BASE.replace(/\/api\/?$/, "") || "http://localhost:4000");

export type AdminRole = "USER" | "ADMIN";
export type AdminUserStatus = "ACTIVE" | "INACTIVE";

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  createdAt: string;
  requestsCreated: number;
  applicationsSent: number;
  isRootAdmin: boolean;
  whatsapp?: string | null;
}

export interface PaginatedUsersResponse {
  users: AdminUserDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardDto {
  users: {
    total: number;
    active: number;
    byRole: Record<AdminRole, number>;
  };
  requests: {
    total: number;
    open: number;
    review: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  applications: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  metrics: {
    avgApplicationsPerRequest: number;
    acceptanceRate: number;
    mostActiveUsers: Array<{
      id: string;
      name: string;
      email: string;
      requestsCreated: number;
      applicationsSent: number;
      totalActivity: number;
    }>;
    requestsLast7Days: number;
  };
}

export interface AdminLogDto {
  id: string;
  adminId: string;
  action: string;
  targetUserId: string | null;
  description: string;
  createdAt: string;
  admin: { id: string; name: string; email: string };
  targetUser: { id: string; name: string; email: string } | null;
}

export interface PaginatedLogsResponse {
  logs: AdminLogDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: AdminRole;
  search?: string;
}

export interface ListLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  adminId?: string;
  targetUserId?: string;
  from?: string;
  to?: string;
}

export interface UpdateUserPayload {
  name?: string;
  status?: AdminUserStatus;
  role?: AdminRole;
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(response: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body = (await response.json()) as { message?: string };
    if (body?.message) message = body.message;
  } catch {
    /* ignore */
  }
  throw new HttpError(response.status, message);
}

/** Usuario con rol ADMIN. */
export function isAdmin(user: Pick<User, "role"> | null | undefined): boolean {
  return user?.role === "ADMIN";
}

/** Admin padre principal (requiere `isRootAdmin` del API). */
export function isRootAdmin(
  user: { isRootAdmin?: boolean } | null | undefined,
): boolean {
  return !!user?.isRootAdmin;
}

export async function getAdminDashboard(token: string): Promise<DashboardDto> {
  const response = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    await parseError(response, "Error al cargar dashboard");
  }
  return response.json() as Promise<DashboardDto>;
}

export async function getUsers(
  token: string,
  params: ListUsersParams = {},
): Promise<PaginatedUsersResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.role) qs.set("role", params.role);
  if (params.search) qs.set("search", params.search);

  const response = await fetch(`${API_BASE}/admin/users?${qs}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    await parseError(response, "Error al listar usuarios");
  }
  return response.json() as Promise<PaginatedUsersResponse>;
}

export async function getUserDetail(
  token: string,
  userId: string,
): Promise<CurrentUserDto> {
  return fetchUserById(token, userId);
}

export async function updateUserRole(
  token: string,
  userId: string,
  role: AdminRole,
): Promise<{ user: AdminUserDto }> {
  const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    await parseError(response, "Error al cambiar rol");
  }
  return response.json() as Promise<{ user: AdminUserDto }>;
}

/** Actualiza nombre/estado localmente vía rol + eliminación lógica según payload. */
export async function updateUser(
  token: string,
  userId: string,
  payload: UpdateUserPayload,
): Promise<AdminUserDto | CurrentUserDto> {
  if (payload.role) {
    const { user } = await updateUserRole(token, userId, payload.role);
    return user;
  }
  return getUserDetail(token, userId);
}

export async function deleteUser(
  token: string,
  userId: string,
): Promise<{ user: AdminUserDto; message: string }> {
  const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    await parseError(response, "Error al eliminar usuario");
  }
  return response.json() as Promise<{ user: AdminUserDto; message: string }>;
}

export async function getAdminLogs(
  token: string,
  params: ListLogsParams = {},
): Promise<PaginatedLogsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.action) qs.set("action", params.action);
  if (params.adminId) qs.set("adminId", params.adminId);
  if (params.targetUserId) qs.set("targetUserId", params.targetUserId);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);

  const response = await fetch(`${API_BASE}/admin/logs?${qs}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    await parseError(response, "Error al cargar logs");
  }
  return response.json() as Promise<PaginatedLogsResponse>;
}

export {
  getHomePublication,
  saveHomePublication,
  getHomeSteps,
  saveHomeSteps,
  updateHomeContent,
  type HomePublication,
  type HomeStep,
  type HomeContent,
} from "@/src/lib/homeContent";
