import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { CardValidationError } from "../card.utils";
import * as paymentsService from "../services/payments.service";
import {
  PaymentDeclinedError,
  PaymentError,
} from "../services/payments.service";
import {
  escrowCardPaymentSchema,
  listPaymentsQuerySchema,
  planCardPaymentSchema,
  updatePaymentSettingsSchema,
} from "../../../validators/payment.schema";

export function handlePaymentError(res: Response, error: unknown, context: string) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: error.issues[0]?.message ?? "Datos de pago inválidos",
    });
  }
  if (error instanceof CardValidationError) {
    return res.status(400).json({ message: error.message, code: "CARD_INVALID" });
  }
  if (error instanceof PaymentDeclinedError) {
    return res.status(402).json({
      message: error.message,
      code: error.code,
      paymentId: error.paymentId,
    });
  }
  if (error instanceof PaymentError) {
    return res.status(error.status).json({ message: error.message });
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return res.status(409).json({ message: "Este pago ya fue registrado" });
  }
  console.error(context, error);
  return res.status(500).json({ message: "No se pudo procesar el pago" });
}

function requireUserId(req: Request, res: Response): string | null {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return userId;
}

// ── Usuario ────────────────────────────────────────────────────────────────

export async function getConfig(_req: Request, res: Response) {
  try {
    return res.json(await paymentsService.getPublicConfig());
  } catch (error) {
    return handlePaymentError(res, error, "[GET /payments/config]");
  }
}

export async function getMine(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    return res.json(await paymentsService.getMyPayments(userId));
  } catch (error) {
    return handlePaymentError(res, error, "[GET /payments/me]");
  }
}

export async function getPayment(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const isAdmin = (req as AuthRequest).user?.role === "ADMIN";
    const payment = await paymentsService.getPaymentForUser(
      req.params.id,
      userId,
      isAdmin,
    );
    return res.json({ payment });
  } catch (error) {
    return handlePaymentError(res, error, "[GET /payments/:id]");
  }
}

export async function getEscrowForRequest(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const payments = await paymentsService.getEscrowForRequest(
      req.params.requestId,
      userId,
    );
    return res.json({ payments });
  } catch (error) {
    return handlePaymentError(res, error, "[GET /payments/escrow/request/:id]");
  }
}

export async function payPlanCard(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const { period, card } = planCardPaymentSchema.parse(req.body);
    const result = await paymentsService.payPlanWithCard(userId, period, card);
    return res.status(201).json(result);
  } catch (error) {
    return handlePaymentError(res, error, "[POST /payments/plan/card]");
  }
}

export async function payEscrowCard(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const { applicationId, card } = escrowCardPaymentSchema.parse(req.body);
    const result = await paymentsService.payEscrowWithCard(userId, applicationId, card);
    return res.status(201).json(result);
  } catch (error) {
    return handlePaymentError(res, error, "[POST /payments/escrow/card]");
  }
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function adminList(req: Request, res: Response) {
  try {
    const query = listPaymentsQuerySchema.parse(req.query);
    return res.json(await paymentsService.listPayments(query));
  } catch (error) {
    return handlePaymentError(res, error, "[GET /admin/payments]");
  }
}

export async function adminSummary(_req: Request, res: Response) {
  try {
    return res.json(await paymentsService.getSummary());
  } catch (error) {
    return handlePaymentError(res, error, "[GET /admin/payments/summary]");
  }
}

export async function adminGetSettings(_req: Request, res: Response) {
  try {
    return res.json({ settings: await paymentsService.getSettings() });
  } catch (error) {
    return handlePaymentError(res, error, "[GET /admin/payments/settings]");
  }
}

export async function adminUpdateSettings(req: Request, res: Response) {
  const adminId = requireUserId(req, res);
  if (!adminId) return;
  try {
    const input = updatePaymentSettingsSchema.parse(req.body);
    const settings = await paymentsService.updateSettings(adminId, input);
    return res.json({ settings });
  } catch (error) {
    return handlePaymentError(res, error, "[PUT /admin/payments/settings]");
  }
}

function adminAction(
  action: (adminId: string, paymentId: string, req: Request) => Promise<unknown>,
  context: string,
) {
  return async (req: Request, res: Response) => {
    const adminId = requireUserId(req, res);
    if (!adminId) return;
    try {
      const payment = await action(adminId, req.params.id, req);
      return res.json({ payment });
    } catch (error) {
      return handlePaymentError(res, error, context);
    }
  };
}

export const adminRelease = adminAction(
  (adminId, id) => paymentsService.adminReleaseEscrow(adminId, id),
  "[POST /admin/payments/:id/release]",
);

export const adminRefund = adminAction(
  (adminId, id) => paymentsService.adminRefundEscrow(adminId, id),
  "[POST /admin/payments/:id/refund]",
);
