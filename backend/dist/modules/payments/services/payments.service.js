"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentDeclinedError = exports.PaymentError = void 0;
exports.formatPen = formatPen;
exports.toPaymentDto = toPaymentDto;
exports.getSettings = getSettings;
exports.getPublicConfig = getPublicConfig;
exports.updateSettings = updateSettings;
exports.payPlanWithCard = payPlanWithCard;
exports.payEscrowWithCard = payEscrowWithCard;
exports.releaseEscrowIfBothRated = releaseEscrowIfBothRated;
exports.getMyPayments = getMyPayments;
exports.getPaymentForUser = getPaymentForUser;
exports.getEscrowForRequest = getEscrowForRequest;
exports.listPayments = listPayments;
exports.getSummary = getSummary;
exports.adminReleaseEscrow = adminReleaseEscrow;
exports.adminRefundEscrow = adminRefundEscrow;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../../../prisma"));
const card_utils_1 = require("../card.utils");
const plan_utils_1 = require("../../plans/plan.utils");
const applications_service_1 = require("../../applications/services/applications.service");
const notificationsService = __importStar(require("../../notifications/services/notifications.service"));
const adminRepository = __importStar(require("../../admin/repositories/admin.repository"));
const admin_realtime_1 = require("../../../realtime/admin.realtime");
// ── Errores ────────────────────────────────────────────────────────────────
class PaymentError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
        this.name = "PaymentError";
    }
}
exports.PaymentError = PaymentError;
class PaymentDeclinedError extends Error {
    constructor(message, paymentId) {
        super(message);
        this.paymentId = paymentId;
        this.code = "CARD_DECLINED";
        this.name = "PaymentDeclinedError";
    }
}
exports.PaymentDeclinedError = PaymentDeclinedError;
// ── Helpers ────────────────────────────────────────────────────────────────
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Código legible para el recibo, p. ej. FX-7K2M9QXA. */
function newPaymentCode() {
    const bytes = crypto_1.default.randomBytes(8);
    let code = "";
    for (const b of bytes)
        code += CODE_ALPHABET[b % CODE_ALPHABET.length];
    return `FX-${code}`;
}
function formatPen(cents) {
    return `S/ ${(cents / 100).toFixed(2)}`;
}
function formatDate(date) {
    return date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}
const OPEN_REQUEST_STATUSES = ["ABIERTA", "EN_REVISION", "EN_PROCESO"];
const paymentInclude = {
    payer: { select: { id: true, name: true, email: true } },
    payee: { select: { id: true, name: true, email: true } },
    application: {
        select: { id: true, request: { select: { id: true, title: true } } },
    },
};
function toPaymentDto(p, options = {}) {
    const person = (u) => ({
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
// ── Configuración ──────────────────────────────────────────────────────────
/** Fila única de configuración; se crea con valores por defecto si no existe. */
async function getSettings() {
    return prisma_1.default.paymentSettings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 },
    });
}
/** Lo que cualquier visitante necesita para ver precios y pagar. */
async function getPublicConfig() {
    const s = await getSettings();
    return {
        currency: "PEN",
        // Único método: tarjeta en modo demo (no se cobra dinero real).
        cardTestMode: true,
        proMonthlyCents: s.proMonthlyCents,
        proYearlyCents: s.proYearlyCents,
        freeCommissionPct: s.freeCommissionBps / 100,
        freeLimits: plan_utils_1.FREE_LIMITS,
    };
}
async function updateSettings(adminId, input) {
    await getSettings();
    const changed = Object.keys(input).filter((k) => input[k] !== undefined);
    return prisma_1.default.$transaction(async (tx) => {
        const settings = await tx.paymentSettings.update({
            where: { id: 1 },
            data: input,
        });
        await adminRepository.createAdminLog({
            adminId,
            action: "PAYMENT_SETTINGS_UPDATED",
            description: `Actualizó la configuración de pagos (${changed.join(", ") || "sin cambios"})`,
        }, tx);
        return settings;
    });
}
// ── Planes ─────────────────────────────────────────────────────────────────
function planPrice(settings, period) {
    return period === "YEARLY" ? settings.proYearlyCents : settings.proMonthlyCents;
}
function planDescription(period) {
    return period === "YEARLY" ? "Plan Pro anual" : "Plan Pro mensual";
}
/** Activa (o extiende) Pro y destaca las solicitudes abiertas del usuario. */
async function activatePlanInTx(tx, userId, period) {
    const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { plan: true, planExpiresAt: true },
    });
    const current = (0, plan_utils_1.isProActive)(user) ? user.planExpiresAt : null;
    const planExpiresAt = (0, plan_utils_1.extendPlanExpiry)(current, period);
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
function notifyPlanActivated(userId, paymentId, period, planExpiresAt) {
    void notificationsService.notifyPaymentUpdate({
        userId,
        title: "¡Ya eres Pro!",
        message: `Tu ${planDescription(period).toLowerCase()} está activo hasta el ${formatDate(planExpiresAt)}.`,
        paymentId,
    });
}
async function payPlanWithCard(userId, period, cardInput) {
    const settings = await getSettings();
    if (!settings.cardEnabled) {
        throw new PaymentError("El pago con tarjeta no está disponible por ahora");
    }
    const card = (0, card_utils_1.validateCard)(cardInput);
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
    };
    const authorization = (0, card_utils_1.simulateAuthorization)(card);
    if (!authorization.approved) {
        const declined = await prisma_1.default.payment.create({
            data: {
                ...base,
                code: newPaymentCode(),
                status: "REJECTED",
                declineReason: authorization.reason,
            },
        });
        throw new PaymentDeclinedError(authorization.reason, declined.id);
    }
    const { payment, planExpiresAt } = await prisma_1.default.$transaction(async (tx) => {
        const payment = await tx.payment.create({
            data: { ...base, code: newPaymentCode(), status: "APPROVED" },
            include: paymentInclude,
        });
        const planExpiresAt = await activatePlanInTx(tx, userId, period);
        return { payment, planExpiresAt };
    });
    notifyPlanActivated(userId, payment.id, period, planExpiresAt);
    void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    return { payment: toPaymentDto(payment), planExpiresAt };
}
// ── Asesorías en garantía (escrow) ─────────────────────────────────────────
async function loadEscrowTarget(payerId, applicationId) {
    const application = await prisma_1.default.application.findUnique({
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
    if (!(0, applications_service_1.requiresEscrow)(application.request)) {
        throw new PaymentError("Esta solicitud no requiere pago en garantía");
    }
    if (application.status !== "PENDIENTE") {
        throw new PaymentError("Esta postulación ya no está pendiente", 409);
    }
    if (application.request.status !== "ABIERTA" &&
        application.request.status !== "EN_REVISION") {
        throw new PaymentError("La solicitud ya no acepta postulantes", 409);
    }
    const active = await prisma_1.default.payment.count({
        where: {
            status: { in: ["PENDING", "HELD"] },
            application: { requestId: application.request.id },
        },
    });
    if (active > 0) {
        throw new PaymentError("Ya hay un pago en verificación o en garantía para esta solicitud", 409);
    }
    return {
        application,
        amountCents: Math.round((application.request.economicBenefit ?? 0) * 100),
        description: `Asesoría: ${application.request.title}`,
    };
}
function notifyEscrowHeld(payment, requestId) {
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
async function payEscrowWithCard(payerId, applicationId, cardInput) {
    const settings = await getSettings();
    if (!settings.cardEnabled) {
        throw new PaymentError("El pago con tarjeta no está disponible por ahora");
    }
    const { application, amountCents, description } = await loadEscrowTarget(payerId, applicationId);
    const card = (0, card_utils_1.validateCard)(cardInput);
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
    };
    const authorization = (0, card_utils_1.simulateAuthorization)(card);
    if (!authorization.approved) {
        // Sin applicationId: un rechazo no debe bloquear el siguiente intento.
        const declined = await prisma_1.default.payment.create({
            data: {
                ...base,
                code: newPaymentCode(),
                status: "REJECTED",
                declineReason: authorization.reason,
            },
        });
        throw new PaymentDeclinedError(authorization.reason, declined.id);
    }
    const { payment, accepted } = await prisma_1.default.$transaction(async (tx) => {
        const payment = await tx.payment.create({
            data: {
                ...base,
                code: newPaymentCode(),
                status: "HELD",
                applicationId,
            },
            include: paymentInclude,
        });
        const accepted = await (0, applications_service_1.acceptApplicationInTx)(tx, applicationId);
        return { payment, accepted };
    });
    (0, applications_service_1.notifyAcceptance)(accepted);
    notifyEscrowHeld(payment, application.request.id);
    return { payment: toPaymentDto(payment) };
}
/** Libera la garantía en cuanto existen las DOS calificaciones. */
async function releaseEscrowIfBothRated(applicationId) {
    const payment = await prisma_1.default.payment.findUnique({
        where: { applicationId },
        select: { id: true, status: true, payerId: true, payeeId: true },
    });
    if (!payment || payment.status !== "HELD" || !payment.payeeId)
        return null;
    const ratings = await prisma_1.default.rating.findMany({
        where: { applicationId },
        select: { raterId: true },
    });
    const raters = new Set(ratings.map((r) => r.raterId));
    if (!raters.has(payment.payerId) || !raters.has(payment.payeeId))
        return null;
    return releaseEscrow(payment.id);
}
async function releaseEscrow(paymentId, adminId) {
    const settings = await getSettings();
    const released = await prisma_1.default.$transaction(async (tx) => {
        const p = await tx.payment.findUnique({
            where: { id: paymentId },
            include: { payee: { select: { plan: true, planExpiresAt: true } } },
        });
        if (!p || p.status !== "HELD") {
            throw new PaymentError("Este pago no está en garantía", 409);
        }
        const payeeIsPro = p.payee ? (0, plan_utils_1.isProActive)(p.payee) : false;
        const commissionCents = (0, plan_utils_1.commissionFor)(p.amountCents, payeeIsPro, settings.freeCommissionBps);
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
            await adminRepository.createAdminLog({
                adminId,
                action: "ESCROW_RELEASED",
                targetUserId: p.payeeId ?? undefined,
                description: `Liberó manualmente ${formatPen(p.amountCents)} del pago ${p.code}`,
            }, tx);
        }
        return tx.payment.findUniqueOrThrow({
            where: { id: paymentId },
            include: paymentInclude,
        });
    });
    const requestId = released.application?.request.id ?? null;
    const title = released.application?.request.title ?? released.description;
    if (released.payeeId) {
        const commission = released.commissionCents > 0
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
    void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    return toPaymentDto(released);
}
// ── Consultas del usuario ──────────────────────────────────────────────────
async function getMyPayments(userId) {
    const [user, payments] = await Promise.all([
        prisma_1.default.user.findUniqueOrThrow({
            where: { id: userId },
            select: { plan: true, planExpiresAt: true },
        }),
        prisma_1.default.payment.findMany({
            where: { OR: [{ payerId: userId }, { payeeId: userId }] },
            include: paymentInclude,
            orderBy: { createdAt: "desc" },
            take: 50,
        }),
    ]);
    const isPro = (0, plan_utils_1.isProActive)(user);
    return {
        plan: {
            plan: (0, plan_utils_1.effectivePlan)(user),
            isPro,
            planExpiresAt: isPro ? user.planExpiresAt : null,
        },
        payments: payments.map((p) => toPaymentDto(p)),
    };
}
async function getPaymentForUser(paymentId, userId, isAdmin) {
    const payment = await prisma_1.default.payment.findUnique({
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
async function getEscrowForRequest(requestId, userId) {
    const request = await prisma_1.default.request.findUnique({
        where: { id: requestId },
        select: { creatorId: true },
    });
    if (!request) {
        throw new PaymentError("Solicitud no encontrada", 404);
    }
    const payments = await prisma_1.default.payment.findMany({
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
async function listPayments(query) {
    const { page, limit, status, purpose, search } = query;
    const where = { status, purpose };
    if (search) {
        where.OR = [
            { code: { contains: search, mode: "insensitive" } },
            { payer: { email: { contains: search, mode: "insensitive" } } },
            { payer: { name: { contains: search, mode: "insensitive" } } },
        ];
    }
    const [payments, total] = await Promise.all([
        prisma_1.default.payment.findMany({
            where,
            include: paymentInclude,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.default.payment.count({ where }),
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
async function getSummary() {
    const [groups, payoutsDue, activeProUsers] = await Promise.all([
        prisma_1.default.payment.groupBy({
            by: ["purpose", "mode", "status"],
            _sum: { amountCents: true, commissionCents: true },
            _count: { _all: true },
        }),
        prisma_1.default.payment.aggregate({
            where: { status: "RELEASED", mode: "LIVE", payoutSentAt: null },
            _sum: { payoutCents: true },
            _count: { _all: true },
        }),
        prisma_1.default.user.count({
            where: { plan: "PRO", planExpiresAt: { gt: new Date() } },
        }),
    ]);
    // Ingreso de la app = planes aprobados + comisiones de asesorías liberadas.
    const byMode = (mode) => {
        let revenueCents = 0;
        let heldCents = 0;
        let approvedCount = 0;
        for (const g of groups) {
            if (g.mode !== mode)
                continue;
            if (g.purpose === "PLAN_SUBSCRIPTION" && g.status === "APPROVED") {
                revenueCents += g._sum.amountCents ?? 0;
                approvedCount += g._count._all;
            }
            if (g.purpose === "ASESORIA_ESCROW" && g.status === "RELEASED") {
                revenueCents += g._sum.commissionCents ?? 0;
            }
            if (g.status === "HELD")
                heldCents += g._sum.amountCents ?? 0;
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
async function adminReleaseEscrow(adminId, paymentId) {
    return releaseEscrow(paymentId, adminId);
}
async function adminRefundEscrow(adminId, paymentId) {
    const payment = await prisma_1.default.$transaction(async (tx) => {
        const p = await tx.payment.findUnique({ where: { id: paymentId } });
        if (!p)
            throw new PaymentError("Pago no encontrado", 404);
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
        await adminRepository.createAdminLog({
            adminId,
            action: "ESCROW_REFUNDED",
            targetUserId: p.payerId,
            description: `Reembolsó ${formatPen(p.amountCents)} del pago ${p.code}`,
        }, tx);
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
    void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    return toPaymentDto(payment, { includeEmails: true });
}
