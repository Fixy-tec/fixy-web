"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentSettingsSchema = exports.listPaymentsQuerySchema = exports.escrowCardPaymentSchema = exports.planCardPaymentSchema = void 0;
const zod_1 = require("zod");
const cardSchema = zod_1.z.object({
    number: zod_1.z.string().trim().min(12).max(23),
    holder: zod_1.z.string().trim().min(3).max(60),
    expMonth: zod_1.z.coerce.number().int(),
    expYear: zod_1.z.coerce.number().int(),
    cvv: zod_1.z.string().trim().min(3).max(4),
});
const periodSchema = zod_1.z.enum(["MONTHLY", "YEARLY"]);
exports.planCardPaymentSchema = zod_1.z.object({
    period: periodSchema,
    card: cardSchema,
});
exports.escrowCardPaymentSchema = zod_1.z.object({
    applicationId: zod_1.z.string().uuid(),
    card: cardSchema,
});
exports.listPaymentsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED", "HELD", "RELEASED", "REFUNDED"]).optional(),
    purpose: zod_1.z.enum(["PLAN_SUBSCRIPTION", "ASESORIA_ESCROW"]).optional(),
    search: zod_1.z.string().trim().max(80).optional(),
});
/** Campos de texto opcionales: "" se guarda como null para poder borrarlos. */
const optionalText = (max, regex, message) => zod_1.z
    .string()
    .trim()
    .max(max)
    .refine((v) => v === "" || !regex || regex.test(v), { message: message ?? "Formato inválido" })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();
exports.updatePaymentSettingsSchema = zod_1.z.object({
    proMonthlyCents: zod_1.z.coerce.number().int().min(100).max(100000).optional(),
    proYearlyCents: zod_1.z.coerce.number().int().min(100).max(1000000).optional(),
    freeCommissionBps: zod_1.z.coerce.number().int().min(0).max(3000).optional(),
    payoutBank: optionalText(60),
    payoutHolder: optionalText(80),
    payoutAccount: optionalText(30, /^[\d-]{6,30}$/, "Número de cuenta o tarjeta inválido"),
    payoutCci: optionalText(20, /^\d{20}$/, "El CCI debe tener 20 dígitos"),
});
