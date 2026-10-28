import { HttpError } from "@/src/lib/httpError";
import type { User } from "@/src/context/AuthContext";
import type { CurrentUserDto } from "@/src/lib/user";
import { fetchUserById } from "@/src/lib/user";
import type {
  PaymentDto,
  PaymentPurpose,
  PaymentStatus,
} from "@/src/lib/payment";

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
  status?: AdminUserStatusFilter;
}

export type AdminUserStatusFilter = "ACTIVE" | "INACTIVE" | "ALL";

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
  if (params.status) qs.set("status", params.status);

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

// ── Pagos ──────────────────────────────────────────────────────────────────

export interface AdminPaymentsSummaryDto {
  live: { revenueCents: number; heldCents: number; approvedPlans: number };
  test: { revenueCents: number; heldCents: number; approvedPlans: number };
  pending: { count: number; amountCents: number };
  payoutsDue: { count: number; amountCents: number };
  activeProUsers: number;
}

export interface PaymentSettingsDto {
  proMonthlyCents: number;
  proYearlyCents: number;
  freeCommissionBps: number;
  payoutBank: string | null;
  payoutHolder: string | null;
  payoutAccount: string | null;
  payoutCci: string | null;
  updatedAt: string;
}

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  purpose?: PaymentPurpose;
  search?: string;
}

export interface PaginatedPaymentsResponse {
  payments: PaymentDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** Garantías de asesorías: liberar al ayudante o reembolsar al solicitante. */
export type AdminPaymentAction = "release" | "refund";

export async function getAdminPayments(
  token: string,
  params: ListPaymentsParams = {},
): Promise<PaginatedPaymentsResponse> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const response = await fetch(`${API_BASE}/admin/payments?${qs}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) await parseError(response, "Error al listar pagos");
  return response.json() as Promise<PaginatedPaymentsResponse>;
}

export async function getAdminPaymentsSummary(
  token: string,
): Promise<AdminPaymentsSummaryDto> {
  const response = await fetch(`${API_BASE}/admin/payments/summary`, {
    headers: authHeaders(token),
  });
  if (!response.ok) await parseError(response, "Error al cargar el resumen de pagos");
  return response.json() as Promise<AdminPaymentsSummaryDto>;
}

export async function getPaymentSettings(token: string): Promise<PaymentSettingsDto> {
  const response = await fetch(`${API_BASE}/admin/payments/settings`, {
    headers: authHeaders(token),
  });
  if (!response.ok) await parseError(response, "Error al cargar la configuración");
  const body = (await response.json()) as { settings: PaymentSettingsDto };
  return body.settings;
}

export async function updatePaymentSettings(
  token: string,
  input: Partial<Omit<PaymentSettingsDto, "updatedAt">>,
): Promise<PaymentSettingsDto> {
  const response = await fetch(`${API_BASE}/admin/payments/settings`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!response.ok) await parseError(response, "No se pudo guardar la configuración");
  const body = (await response.json()) as { settings: PaymentSettingsDto };
  return body.settings;
}

export async function runAdminPaymentAction(
  token: string,
  paymentId: string,
  action: AdminPaymentAction,
): Promise<PaymentDto> {
  const response = await fetch(`${API_BASE}/admin/payments/${paymentId}/${action}`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!response.ok) await parseError(response, "No se pudo completar la acción");
  const result = (await response.json()) as { payment: PaymentDto };
  return result.payment;
}

// ── Indicadores (KPIs) ─────────────────────────────────────────────────────

/** Cada venta que sumó ingresos, en orden: el ROI sube un escalón con cada una. */
export interface RoiStepDto {
  index: number;
  at: string;
  code: string;
  description: string;
  incomeCents: number;
  cumulativeRevenueCents: number;
  roi: number;
}

/** ROI de simulación: inversión fija y pagos de la app (modo demo). */
export interface RoiReportDto {
  formula: string;
  investmentCents: number;
  revenueCents: number;
  profitCents: number;
  /** Fracción (−0.80 = −80%). */
  roi: number;
  /** Fracción de la inversión ya recuperada (1 = 100%). */
  recovered: number;
  remainingCents: number;
  salesToBreakEven: { yearlyPlans: number; monthlyPlans: number };
  revenue: { plansCents: number; commissionsCents: number };
  plansSold: number;
  activeProUsers: number;
  /** Número de venta con la que se recuperó la inversión (null = aún no). */
  breakEvenSale: number | null;
  steps: RoiStepDto[];
  prices: { proMonthlyCents: number; proYearlyCents: number };
}

export async function getRoiReport(token: string): Promise<RoiReportDto> {
  const response = await fetch(`${API_BASE}/admin/kpis/roi`, {
    headers: authHeaders(token),
  });
  if (!response.ok) await parseError(response, "No se pudo calcular el ROI");
  return response.json() as Promise<RoiReportDto>;
}
