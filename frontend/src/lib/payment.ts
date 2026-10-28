const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type BillingPeriod = "MONTHLY" | "YEARLY";
export type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "HELD"
  | "RELEASED"
  | "REFUNDED";
export type PaymentPurpose = "PLAN_SUBSCRIPTION" | "ASESORIA_ESCROW";
export type PaymentMethod = "CARD" | "YAPE";
export type PaymentMode = "TEST" | "LIVE";

export interface PaymentPersonDto {
  id: string;
  name: string;
  email?: string;
}

export interface PaymentDto {
  id: string;
  code: string;
  purpose: PaymentPurpose;
  method: PaymentMethod;
  mode: PaymentMode;
  status: PaymentStatus;
  amountCents: number;
  commissionCents: number;
  payoutCents: number | null;
  currency: string;
  description: string;
  planPeriod: BillingPeriod | null;
  cardBrand: string | null;
  cardLast4: string | null;
  cardHolder: string | null;
  declineReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  payoutSentAt: string | null;
  applicationId: string | null;
  payer: PaymentPersonDto;
  payee: PaymentPersonDto | null;
  request: { id: string; title: string } | null;
}

export interface PaymentConfigDto {
  currency: string;
  cardTestMode: boolean;
  proMonthlyCents: number;
  proYearlyCents: number;
  freeCommissionPct: number;
  freeLimits: { activeRequests: number; applicationsPerWeek: number };
}

export interface CardPayload {
  number: string;
  holder: string;
  expMonth: number;
  expYear: number;
  cvv: string;
}

export interface MyPaymentsDto {
  plan: { plan: "FREE" | "PRO"; isPro: boolean; planExpiresAt: string | null };
  payments: PaymentDto[];
}

export interface ProStatsDto {
  profileViews: number;
  applicationsSent: number;
  applicationsAccepted: number;
  acceptanceRate: number;
  requestsCreated: number;
  requestsCompleted: number;
  earnings: {
    totalCents: number;
    count: number;
    heldCents: number;
    recent: {
      id: string;
      code: string;
      description: string;
      payoutCents: number | null;
      commissionCents: number;
      mode: PaymentMode;
      releasedAt: string | null;
    }[];
  };
}

/** Error de la API con el código de negocio (CARD_DECLINED, PLAN_REQUIRED…). */
export class PaymentApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "PaymentApiError";
  }
}

async function request<T>(
  path: string,
  options: { token?: string; method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = (await response.json().catch(() => null)) as
    | (T & { message?: string; code?: string })
    | null;
  if (!response.ok) {
    throw new PaymentApiError(
      data?.message ?? "No se pudo completar la operación",
      response.status,
      data?.code,
    );
  }
  return data as T;
}

export const fetchPaymentConfig = () => request<PaymentConfigDto>("/payments/config");

export const fetchMyPayments = (token: string) =>
  request<MyPaymentsDto>("/payments/me", { token });

export const fetchPayment = (token: string, id: string) =>
  request<{ payment: PaymentDto }>(`/payments/${id}`, { token }).then((r) => r.payment);

export const fetchEscrowForRequest = (token: string, requestId: string) =>
  request<{ payments: PaymentDto[] }>(`/payments/escrow/request/${requestId}`, {
    token,
  }).then((r) => r.payments);

export const fetchProStats = (token: string) =>
  request<{ stats: ProStatsDto }>("/users/me/stats", { token }).then((r) => r.stats);

export const payPlanWithCard = (token: string, period: BillingPeriod, card: CardPayload) =>
  request<{ payment: PaymentDto }>("/payments/plan/card", {
    token,
    method: "POST",
    body: { period, card },
  }).then((r) => r.payment);

export const payEscrowWithCard = (token: string, applicationId: string, card: CardPayload) =>
  request<{ payment: PaymentDto }>("/payments/escrow/card", {
    token,
    method: "POST",
    body: { applicationId, card },
  }).then((r) => r.payment);

// ── Presentación ───────────────────────────────────────────────────────────

export function formatPen(cents: number | null | undefined): string {
  return `S/ ${((cents ?? 0) / 100).toFixed(2)}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "En verificación",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  HELD: "En garantía",
  RELEASED: "Liberado",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  REJECTED: "bg-rose-50 text-rose-600 border-rose-100",
  HELD: "bg-[#eff4ff] text-[#1a4ca3] border-[#1a4ca3]/20",
  RELEASED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  REFUNDED: "bg-gray-100 text-gray-600 border-gray-200",
};

export function paymentMethodLabel(p: Pick<PaymentDto, "method" | "cardBrand" | "cardLast4">): string {
  if (p.method === "YAPE") return "Yape";
  const brand = p.cardBrand
    ? p.cardBrand.charAt(0) + p.cardBrand.slice(1).toLowerCase()
    : "Tarjeta";
  return p.cardLast4 ? `${brand} •••• ${p.cardLast4}` : brand;
}

/** Pro solo cuenta si no venció (útil para datos de otros usuarios). */
export function isPlanActive(plan?: string | null, planExpiresAt?: string | null): boolean {
  return plan === "PRO" && !!planExpiresAt && new Date(planExpiresAt).getTime() > Date.now();
}

// ── Tarjeta (validación en el navegador; el backend vuelve a validar) ──────

export type CardBrand = "VISA" | "MASTERCARD" | "AMEX" | "DINERS";

export function detectCardBrand(digits: string): CardBrand | null {
  if (/^4/.test(digits)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "MASTERCARD";
  if (/^3[47]/.test(digits)) return "AMEX";
  if (/^3(0[0-5]|[68])/.test(digits)) return "DINERS";
  return null;
}

export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return digits.length >= 13 && sum % 10 === 0;
}

/** Agrupa los dígitos como en la tarjeta física (Amex: 4-6-5). */
export function formatCardNumber(digits: string): string {
  const brand = detectCardBrand(digits);
  if (brand === "AMEX") {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Tarjetas para probar la pasarela en modo prueba. */
export const TEST_CARDS = [
  { number: "4242 4242 4242 4242", result: "Pago aprobado (Visa)" },
  { number: "5555 5555 5555 4444", result: "Pago aprobado (Mastercard)" },
  { number: "4000 0000 0000 0002", result: "Rechazada por el banco" },
  { number: "4000 0000 0000 9995", result: "Fondos insuficientes" },
];
