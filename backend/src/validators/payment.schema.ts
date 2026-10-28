import { z } from "zod";

const cardSchema = z.object({
  number: z.string().trim().min(12).max(23),
  holder: z.string().trim().min(3).max(60),
  expMonth: z.coerce.number().int(),
  expYear: z.coerce.number().int(),
  cvv: z.string().trim().min(3).max(4),
});

const periodSchema = z.enum(["MONTHLY", "YEARLY"]);

export const planCardPaymentSchema = z.object({
  period: periodSchema,
  card: cardSchema,
});

export const escrowCardPaymentSchema = z.object({
  applicationId: z.string().uuid(),
  card: cardSchema,
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "HELD", "RELEASED", "REFUNDED"]).optional(),
  purpose: z.enum(["PLAN_SUBSCRIPTION", "ASESORIA_ESCROW"]).optional(),
  search: z.string().trim().max(80).optional(),
});

/** Campos de texto opcionales: "" se guarda como null para poder borrarlos. */
const optionalText = (max: number, regex?: RegExp, message?: string) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => v === "" || !regex || regex.test(v), { message: message ?? "Formato inválido" })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const updatePaymentSettingsSchema = z.object({
  proMonthlyCents: z.coerce.number().int().min(100).max(100_000).optional(),
  proYearlyCents: z.coerce.number().int().min(100).max(1_000_000).optional(),
  freeCommissionBps: z.coerce.number().int().min(0).max(3000).optional(),
  payoutBank: optionalText(60),
  payoutHolder: optionalText(80),
  payoutAccount: optionalText(30, /^[\d-]{6,30}$/, "Número de cuenta o tarjeta inválido"),
  payoutCci: optionalText(20, /^\d{20}$/, "El CCI debe tener 20 dígitos"),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type UpdatePaymentSettingsInput = z.infer<typeof updatePaymentSettingsSchema>;
