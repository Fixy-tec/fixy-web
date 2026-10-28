import { PlanType } from "@prisma/client";

/** Límites del plan Free. Pro no tiene límites. */
export const FREE_LIMITS = {
  activeRequests: 3,
  applicationsPerWeek: 5,
} as const;

export interface PlanFields {
  plan: PlanType;
  planExpiresAt: Date | null;
}

/** Pro solo cuenta mientras no haya vencido. */
export function isProActive(user: PlanFields, now = new Date()): boolean {
  return (
    user.plan === "PRO" &&
    user.planExpiresAt != null &&
    user.planExpiresAt.getTime() > now.getTime()
  );
}

export function effectivePlan(user: PlanFields): PlanType {
  return isProActive(user) ? "PRO" : "FREE";
}

/** Nueva fecha de vencimiento: si ya es Pro, se suma al tiempo que le queda. */
export function extendPlanExpiry(
  current: Date | null,
  period: "MONTHLY" | "YEARLY",
  now = new Date(),
): Date {
  const base =
    current && current.getTime() > now.getTime() ? new Date(current) : new Date(now);
  if (period === "YEARLY") base.setFullYear(base.getFullYear() + 1);
  else base.setMonth(base.getMonth() + 1);
  return base;
}

/** Comisión en céntimos: Pro no paga comisión. */
export function commissionFor(
  amountCents: number,
  payeeIsPro: boolean,
  freeCommissionBps: number,
): number {
  if (payeeIsPro) return 0;
  return Math.round((amountCents * freeCommissionBps) / 10_000);
}

export class PlanLimitError extends Error {
  readonly code = "PLAN_LIMIT_REACHED";
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export class PlanRequiredError extends Error {
  readonly code = "PLAN_REQUIRED";
  constructor(message = "Esta función es exclusiva del plan Pro") {
    super(message);
    this.name = "PlanRequiredError";
  }
}
