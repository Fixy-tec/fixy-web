import crypto from "crypto";
import { BillingPeriod, Prisma } from "@prisma/client";
import prisma from "../../../prisma";
import {
  CardInput,
  simulateAuthorization,
  validateCard,
} from "../card.utils";
import {
  commissionFor,
  effectivePlan,
  extendPlanExpiry,
  FREE_LIMITS,
  isProActive,
} from "../../plans/plan.utils";
import {
  acceptApplicationInTx,
  notifyAcceptance,
  requiresEscrow,
} from "../../applications/services/applications.service";
import * as notificationsService from "../../notifications/services/notifications.service";
import * as adminRepository from "../../admin/repositories/admin.repository";
import { notifyAdminDashboardUpdate } from "../../../realtime/admin.realtime";
import type {
  ListPaymentsQuery,
  UpdatePaymentSettingsInput,
} from "../../../validators/payment.schema";

type Tx = Prisma.TransactionClient;

// ── Errores ────────────────────────────────────────────────────────────────

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export class PaymentDeclinedError extends Error {
  readonly code = "CARD_DECLINED";
  constructor(
    message: string,
    readonly paymentId: string,
  ) {
    super(message);
    this.name = "PaymentDeclinedError";
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código legible para el recibo, p. ej. FX-7K2M9QXA. */
function newPaymentCode(): string {
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `FX-${code}`;
}

export function formatPen(cents: number): string {
  return `S/ ${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const OPEN_REQUEST_STATUSES = ["ABIERTA", "EN_REVISION", "EN_PROCESO"] as const;

const paymentInclude = {
  payer: { select: { id: true, name: true, email: true } },
  payee: { select: { id: true, name: true, email: true } },
  application: {
    select: { id: true, request: { select: { id: true, title: true } } },
  },
} satisfies Prisma.PaymentInclude;

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;

export function toPaymentDto(
  p: PaymentWithRelations,
  options: { includeEmails?: boolean } = {},
) {
  const person = (u: { id: string; name: string; email: string }) => ({
    id: u.id,
    name: u.name,
    ...(options.includeEmails ? { email: u.email } : {}),
  });
  return {
    id: p.id,
    code: p.code,
    purpose: p.purpose,
    method: p.method,
    mode: p.mode,
    status: p.status,
    amountCents: p.amountCents,
    commissionCents: p.commissionCents,
    payoutCents: p.payoutCents,
    currency: p.currency,
    description: p.description,
    planPeriod: p.planPeriod,
    cardBrand: p.cardBrand,
    cardLast4: p.cardLast4,
    cardHolder: p.cardHolder,
    declineReason: p.declineReason,
    createdAt: p.createdAt,
    reviewedAt: p.reviewedAt,
    releasedAt: p.releasedAt,
    refundedAt: p.refundedAt,
    payoutSentAt: p.payoutSentAt,
    applicationId: p.applicationId,
    payer: person(p.payer),
    payee: p.payee ? person(p.payee) : null,
    request: p.application?.request ?? null,
  };
}

export type PaymentDto = ReturnType<typeof toPaymentDto>;

// ── Configuración ──────────────────────────────────────────────────────────

/** Fila única de configuración; se crea con valores por defecto si no existe. */
export async function getSettings() {
  return prisma.paymentSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

/** Lo que cualquier visitante necesita para ver precios y pagar. */
export async function getPublicConfig() {
  const s = await getSettings();
  return {
    currency: "PEN",
    // Único método: tarjeta en modo demo (no se cobra dinero real).
    cardTestMode: true,
    proMonthlyCents: s.proMonthlyCents,
    proYearlyCents: s.proYearlyCents,
    freeCommissionPct: s.freeCommissionBps / 100,
    freeLimits: FREE_LIMITS,
  };
}

export async function updateSettings(
  adminId: string,
  input: UpdatePaymentSettingsInput,
) {
  await getSettings();
  const changed = Object.keys(input).filter(
    (k) => input[k as keyof UpdatePaymentSettingsInput] !== undefined,
  );
  return prisma.$transaction(async (tx) => {
    const settings = await tx.paymentSettings.update({
      where: { id: 1 },
      data: input,
    });
    await adminRepository.createAdminLog(
      {
        adminId,
        action: "PAYMENT_SETTINGS_UPDATED",
        description: `Actualizó la configuración de pagos (${changed.join(", ") || "sin cambios"})`,
      },
      tx,
    );
    return settings;
  });
}

// ── Planes ─────────────────────────────────────────────────────────────────

function planPrice(
  settings: { proMonthlyCents: number; proYearlyCents: number },
  period: BillingPeriod,
): number {
  return period === "YEARLY" ? settings.proYearlyCents : settings.proMonthlyCents;
}

function planDescription(period: BillingPeriod): string {
  return period === "YEARLY" ? "Plan Pro anual" : "Plan Pro mensual";
}

/** Activa (o extiende) Pro y destaca las solicitudes abiertas del usuario. */
async function activatePlanInTx(
  tx: Tx,
  userId: string,
  period: BillingPeriod,
): Promise<Date> {
  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  const current = isProActive(user) ? user.planExpiresAt : null;
  const planExpiresAt = extendPlanExpiry(current, period);

  await tx.user.update({
    where: { id: userId },
    data: { plan: "PRO", planExpiresAt },
  });
  await tx.request.updateMany({
    where: { creatorId: userId, status: { in: [...OPEN_REQUEST_STATUSES] } },
    data: { isFeatured: true },
  });
  return planExpiresAt;
}

function notifyPlanActivated(
  userId: string,
  paymentId: string,
  period: BillingPeriod,
  planExpiresAt: Date,
) {
  void notificationsService.notifyPaymentUpdate({
    userId,
    title: "¡Ya eres Pro!",
    message: `Tu ${planDescription(period).toLowerCase()} está activo hasta el ${formatDate(planExpiresAt)}.`,
    paymentId,
  });
}

export async function payPlanWithCard(
  userId: string,
  period: BillingPeriod,
  cardInput: CardInput,
) {
  const settings = await getSettings();
  if (!settings.cardEnabled) {
    throw new PaymentError("El pago con tarjeta no está disponible por ahora");
  }

  const card = validateCard(cardInput);
  const amountCents = planPrice(settings, period);
  const base = {
    purpose: "PLAN_SUBSCRIPTION",
    method: "CARD",
    mode: "TEST",
    amountCents,
    description: planDescription(period),
    payerId: userId,
    planPeriod: period,
    cardBrand: card.brand,
    cardLast4: card.last4,
    cardHolder: card.holder,
  } as const;

  const authorization = simulateAuthorization(card);
  if (!authorization.approved) {
    const declined = await prisma.payment.create({
      data: {
        ...base,
        code: newPaymentCode(),
        status: "REJECTED",
        declineReason: authorization.reason,
      },
    });
    throw new PaymentDeclinedError(authorization.reason, declined.id);
  }

  const { payment, planExpiresAt } = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: { ...base, code: newPaymentCode(), status: "APPROVED" },
      include: paymentInclude,
    });
    const planExpiresAt = await activatePlanInTx(tx, userId, period);
    return { payment, planExpiresAt };
  });

  notifyPlanActivated(userId, payment.id, period, planExpiresAt);
  void notifyAdminDashboardUpdate();
  return { payment: toPaymentDto(payment), planExpiresAt };
}

// ── Asesorías en garantía (escrow) ─────────────────────────────────────────

async function loadEscrowTarget(payerId: string, applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      request: {
        select: {
          id: true,
          title: true,
          type: true,
          economicBenefit: true,
          status: true,
          creatorId: true,
        },
      },
      applicant: { select: { id: true, name: true } },
    },
  });

  if (!application) {
    throw new PaymentError("Postulación no encontrada", 404);
  }
  if (application.request.creatorId !== payerId) {
    throw new PaymentError("Solo el creador de la solicitud puede pagar", 403);
  }
  if (!requiresEscrow(application.request)) {
    throw new PaymentError("Esta solicitud no requiere pago en garantía");
  }
  if (application.status !== "PENDIENTE") {
    throw new PaymentError("Esta postulación ya no está pendiente", 409);
  }
  if (
    application.request.status !== "ABIERTA" &&
    application.request.status !== "EN_REVISION"
  ) {
    throw new PaymentError("La solicitud ya no acepta postulantes", 409);
  }

  const active = await prisma.payment.count({
    where: {
      status: { in: ["PENDING", "HELD"] },
      application: { requestId: application.request.id },
    },
  });
  if (active > 0) {
    throw new PaymentError(
      "Ya hay un pago en verificación o en garantía para esta solicitud",
      409,
    );
  }

  return {
    application,
    amountCents: Math.round((application.request.economicBenefit ?? 0) * 100),
    description: `Asesoría: ${application.request.title}`,
  };
}

function notifyEscrowHeld(payment: PaymentWithRelations, requestId: string) {
  const amount = formatPen(payment.amountCents);
  void notificationsService.notifyPaymentUpdate({
    userId: payment.payerId,
    title: "Pago retenido en garantía",
    message: `${amount} quedan en garantía. Se liberan cuando ambos se califiquen.`,
    paymentId: payment.id,
    requestId,
  });
  if (payment.payeeId) {
    void notificationsService.notifyPaymentUpdate({
      userId: payment.payeeId,
      title: "Tu pago está asegurado",
      message: `${amount} ya están en garantía por "${payment.application?.request.title ?? payment.description}". Los recibes al calificarse ambos.`,
      paymentId: payment.id,
      requestId,
    });
  }
}

export async function payEscrowWithCard(
  payerId: string,
  applicationId: string,
  cardInput: CardInput,
) {
  const settings = await getSettings();
  if (!settings.cardEnabled) {
    throw new PaymentError("El pago con tarjeta no está disponible por ahora");
  }

  const { application, amountCents, description } = await loadEscrowTarget(
    payerId,
    applicationId,
  );
  const card = validateCard(cardInput);
  const base = {
    purpose: "ASESORIA_ESCROW",
    method: "CARD",
    mode: "TEST",
    amountCents,
    description,
    payerId,
    payeeId: application.applicantId,
    cardBrand: card.brand,
    cardLast4: card.last4,
    cardHolder: card.holder,
  } as const;

  const authorization = simulateAuthorization(card);
  if (!authorization.approved) {
    // Sin applicationId: un rechazo no debe bloquear el siguiente intento.
    const declined = await prisma.payment.create({
      data: {
        ...base,
        code: newPaymentCode(),
        status: "REJECTED",
        declineReason: authorization.reason,
      },
    });
    throw new PaymentDeclinedError(authorization.reason, declined.id);
  }

  const { payment, accepted } = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        ...base,
        code: newPaymentCode(),
        status: "HELD",
        applicationId,
      },
      include: paymentInclude,
    });
    const accepted = await acceptApplicationInTx(tx, applicationId);
    return { payment, accepted };
  });

  notifyAcceptance(accepted);
  notifyEscrowHeld(payment, application.request.id);
  return { payment: toPaymentDto(payment) };
}

/** Libera la garantía en cuanto existen las DOS calificaciones. */
export async function releaseEscrowIfBothRated(applicationId: string) {
  const payment = await prisma.payment.findUnique({
    where: { applicationId },
    select: { id: true, status: true, payerId: true, payeeId: true },
  });
  if (!payment || payment.status !== "HELD" || !payment.payeeId) return null;

  const ratings = await prisma.rating.findMany({
    where: { applicationId },
    select: { raterId: true },
  });
  const raters = new Set(ratings.map((r) => r.raterId));
  if (!raters.has(payment.payerId) || !raters.has(payment.payeeId)) return null;

  return releaseEscrow(payment.id);
}

async function releaseEscrow(paymentId: string, adminId?: string) {
  const settings = await getSettings();

  const released = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { payee: { select: { plan: true, planExpiresAt: true } } },
    });
    if (!p || p.status !== "HELD") {
      throw new PaymentError("Este pago no está en garantía", 409);
    }

    const payeeIsPro = p.payee ? isProActive(p.payee) : false;
    const commissionCents = commissionFor(
      p.amountCents,
      payeeIsPro,
      settings.freeCommissionBps,
    );
    const now = new Date();
    // updateMany con status HELD: si dos calificaciones llegan a la vez, solo
    // una libera el pago.
    const result = await tx.payment.updateMany({
      where: { id: paymentId, status: "HELD" },
      data: {
        status: "RELEASED",
        commissionCents,
        payoutCents: p.amountCents - commissionCents,
        releasedAt: now,
        ...(adminId ? { reviewedById: adminId, reviewedAt: now } : {}),
      },
    });
    if (result.count !== 1) {
      throw new PaymentError("Este pago ya fue procesado", 409);
    }

    if (adminId) {
      await adminRepository.createAdminLog(
        {
          adminId,
          action: "ESCROW_RELEASED",
          targetUserId: p.payeeId ?? undefined,
          description: `Liberó manualmente ${formatPen(p.amountCents)} del pago ${p.code}`,
        },
        tx,
      );
    }

    return tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: paymentInclude,
    });
  });

  const requestId = released.application?.request.id ?? null;
  const title = released.application?.request.title ?? released.description;
  if (released.payeeId) {
    const commission =
      released.commissionCents > 0
        ? ` (comisión plan Free: ${formatPen(released.commissionCents)})`
        : "";
    void notificationsService.notifyPaymentUpdate({
      userId: released.payeeId,
      title: "¡Recibiste tu pago!",
      message: `Se liberaron ${formatPen(released.payoutCents ?? 0)} por "${title}"${commission}.`,
      paymentId: released.id,
      requestId,
    });
  }
  void notificationsService.notifyPaymentUpdate({
    userId: released.payerId,
    title: "Pago liberado",
    message: `Ambos se calificaron: el pago de "${title}" se liberó al ayudante.`,
    paymentId: released.id,
    requestId,
  });
  void notifyAdminDashboardUpdate();
  return toPaymentDto(released);
}

// ── Consultas del usuario ──────────────────────────────────────────────────

export async function getMyPayments(userId: string) {
  const [user, payments] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    }),
    prisma.payment.findMany({
      where: { OR: [{ payerId: userId }, { payeeId: userId }] },
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  const isPro = isProActive(user);
  return {
    plan: {
      plan: effectivePlan(user),
      isPro,
      planExpiresAt: isPro ? user.planExpiresAt : null,
    },
    payments: payments.map((p) => toPaymentDto(p)),
  };
}

export async function getPaymentForUser(
  paymentId: string,
  userId: string,
  isAdmin: boolean,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: paymentInclude,
  });
  if (!payment) {
    throw new PaymentError("Pago no encontrado", 404);
  }
  if (!isAdmin && payment.payerId !== userId && payment.payeeId !== userId) {
    throw new PaymentError("No tienes acceso a este pago", 403);
  }
  return toPaymentDto(payment, { includeEmails: isAdmin });
}

/** Pagos en garantía de una solicitud: el creador ve todos; un postulante, solo el suyo. */
export async function getEscrowForRequest(requestId: string, userId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { creatorId: true },
  });
  if (!request) {
    throw new PaymentError("Solicitud no encontrada", 404);
  }
  const payments = await prisma.payment.findMany({
    where: {
      purpose: "ASESORIA_ESCROW",
      application: { requestId },
      ...(request.creatorId === userId ? {} : { payeeId: userId }),
    },
    include: paymentInclude,
    orderBy: { createdAt: "desc" },
  });
  return payments.map((p) => toPaymentDto(p));
}

// ── Panel admin ────────────────────────────────────────────────────────────

export async function listPayments(query: ListPaymentsQuery) {
  const { page, limit, status, purpose, search } = query;
  const where: Prisma.PaymentWhereInput = { status, purpose };
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { payer: { email: { contains: search, mode: "insensitive" } } },
      { payer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments: payments.map((p) => toPaymentDto(p, { includeEmails: true })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getSummary() {
  const [groups, payoutsDue, activeProUsers] = await Promise.all([
    prisma.payment.groupBy({
      by: ["purpose", "mode", "status"],
      _sum: { amountCents: true, commissionCents: true },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: { status: "RELEASED", mode: "LIVE", payoutSentAt: null },
      _sum: { payoutCents: true },
      _count: { _all: true },
    }),
    prisma.user.count({
      where: { plan: "PRO", planExpiresAt: { gt: new Date() } },
    }),
  ]);

  // Ingreso de la app = planes aprobados + comisiones de asesorías liberadas.
  const byMode = (mode: "TEST" | "LIVE") => {
    let revenueCents = 0;
    let heldCents = 0;
    let approvedCount = 0;
    for (const g of groups) {
      if (g.mode !== mode) continue;
      if (g.purpose === "PLAN_SUBSCRIPTION" && g.status === "APPROVED") {
        revenueCents += g._sum.amountCents ?? 0;
        approvedCount += g._count._all;
      }
      if (g.purpose === "ASESORIA_ESCROW" && g.status === "RELEASED") {
        revenueCents += g._sum.commissionCents ?? 0;
      }
      if (g.status === "HELD") heldCents += g._sum.amountCents ?? 0;
    }
    return { revenueCents, heldCents, approvedPlans: approvedCount };
  };

  const pending = groups.filter((g) => g.status === "PENDING");
  return {
    live: byMode("LIVE"),
    test: byMode("TEST"),
    pending: {
      count: pending.reduce((n, g) => n + g._count._all, 0),
      amountCents: pending.reduce((n, g) => n + (g._sum.amountCents ?? 0), 0),
    },
    payoutsDue: {
      count: payoutsDue._count._all,
      amountCents: payoutsDue._sum.payoutCents ?? 0,
    },
    activeProUsers,
  };
}

/** Liberación manual (p. ej. una de las partes nunca calificó). */
export async function adminReleaseEscrow(adminId: string, paymentId: string) {
  return releaseEscrow(paymentId, adminId);
}

export async function adminRefundEscrow(adminId: string, paymentId: string) {
  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p) throw new PaymentError("Pago no encontrado", 404);
    const now = new Date();
    const result = await tx.payment.updateMany({
      where: { id: paymentId, status: "HELD" },
      data: {
        status: "REFUNDED",
        refundedAt: now,
        reviewedById: adminId,
        reviewedAt: now,
      },
    });
    if (result.count !== 1) {
      throw new PaymentError("Solo se pueden reembolsar pagos en garantía", 409);
    }
    await adminRepository.createAdminLog(
      {
        adminId,
        action: "ESCROW_REFUNDED",
        targetUserId: p.payerId,
        description: `Reembolsó ${formatPen(p.amountCents)} del pago ${p.code}`,
      },
      tx,
    );
    return tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: paymentInclude,
    });
  });

  const requestId = payment.application?.request.id ?? null;
  void notificationsService.notifyPaymentUpdate({
    userId: payment.payerId,
    title: "Pago reembolsado",
    message: `Te devolvimos ${formatPen(payment.amountCents)} de "${payment.description}".`,
    paymentId: payment.id,
    requestId,
  });
  if (payment.payeeId) {
    void notificationsService.notifyPaymentUpdate({
      userId: payment.payeeId,
      title: "Pago en garantía reembolsado",
      message: `Un administrador devolvió el pago de "${payment.description}" al solicitante.`,
      paymentId: payment.id,
      requestId,
    });
  }
  void notifyAdminDashboardUpdate();
  return toPaymentDto(payment, { includeEmails: true });
}
