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
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRefund = exports.adminRelease = void 0;
exports.handlePaymentError = handlePaymentError;
exports.getConfig = getConfig;
exports.getMine = getMine;
exports.getPayment = getPayment;
exports.getEscrowForRequest = getEscrowForRequest;
exports.payPlanCard = payPlanCard;
exports.payEscrowCard = payEscrowCard;
exports.adminList = adminList;
exports.adminSummary = adminSummary;
exports.adminGetSettings = adminGetSettings;
exports.adminUpdateSettings = adminUpdateSettings;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const card_utils_1 = require("../card.utils");
const paymentsService = __importStar(require("../services/payments.service"));
const payments_service_1 = require("../services/payments.service");
const payment_schema_1 = require("../../../validators/payment.schema");
function handlePaymentError(res, error, context) {
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: error.issues[0]?.message ?? "Datos de pago inválidos",
        });
    }
    if (error instanceof card_utils_1.CardValidationError) {
        return res.status(400).json({ message: error.message, code: "CARD_INVALID" });
    }
    if (error instanceof payments_service_1.PaymentDeclinedError) {
        return res.status(402).json({
            message: error.message,
            code: error.code,
            paymentId: error.paymentId,
        });
    }
    if (error instanceof payments_service_1.PaymentError) {
        return res.status(error.status).json({ message: error.message });
    }
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002") {
        return res.status(409).json({ message: "Este pago ya fue registrado" });
    }
    console.error(context, error);
    return res.status(500).json({ message: "No se pudo procesar el pago" });
}
function requireUserId(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return null;
    }
    return userId;
}
// ── Usuario ────────────────────────────────────────────────────────────────
async function getConfig(_req, res) {
    try {
        return res.json(await paymentsService.getPublicConfig());
    }
    catch (error) {
        return handlePaymentError(res, error, "[GET /payments/config]");
    }
}
async function getMine(req, res) {
    const userId = requireUserId(req, res);
    if (!userId)
        return;
    try {
        return res.json(await paymentsService.getMyPayments(userId));
    }
    catch (error) {
        return handlePaymentError(res, error, "[GET /payments/me]");
    }
}
async function getPayment(req, res) {
    const userId = requireUserId(req, res);
    if (!userId)
        return;
    try {
        const isAdmin = req.user?.role === "ADMIN";
        const payment = await paymentsService.getPaymentForUser(req.params.id, userId, isAdmin);
        return res.json({ payment });
    }
    catch (error) {
        return handlePaymentError(res, error, "[GET /payments/:id]");
    }
}
async function getEscrowForRequest(req, res) {
    const userId = requireUserId(req, res);
    if (!userId)
        return;
    try {
        const payments = await paymentsService.getEscrowForRequest(req.params.requestId, userId);
        return res.json({ payments });
    }
    catch (error) {
        return handlePaymentError(res, error, "[GET /payments/escrow/request/:id]");
    }
}
async function payPlanCard(req, res) {
    const userId = requireUserId(req, res);
    if (!userId)
        return;
    try {
        const { period, card } = payment_schema_1.planCardPaymentSchema.parse(req.body);
        const result = await paymentsService.payPlanWithCard(userId, period, card);
        return res.status(201).json(result);
    }
    catch (error) {
        return handlePaymentError(res, error, "[POST /payments/plan/card]");
    }
}
async function payEscrowCard(req, res) {
    const userId = requireUserId(req, res);
    if (!userId)
        return;
    try {
        const { applicationId, card } = payment_schema_1.escrowCardPaymentSchema.parse(req.body);
        const result = await paymentsService.payEscrowWithCard(userId, applicationId, card);
        return res.status(201).json(result);
    }
    catch (error) {
        return handlePaymentError(res, error, "[POST /payments/escrow/card]");
    }
}
// ── Admin ──────────────────────────────────────────────────────────────────
async function adminList(req, res) {
    try {
        const query = payment_schema_1.listPaymentsQuerySchema.parse(req.query);
        return res.json(await paymentsService.listPayments(query));
    }
    catch (error) {
        return handlePaymentError(res, error, "[GET /admin/payments]");
    }
}
async function adminSummary(_req, res) {
    try {
        return res.json(await paymentsService.getSummary());
    }
    catch (error) {
        return handlePaymentError(res, error, "[GET /admin/payments/summary]");
    }
}
async function adminGetSettings(_req, res) {
    try {
        return res.json({ settings: await paymentsService.getSettings() });
    }
    catch (error) {
        return handlePaymentError(res, error, "[GET /admin/payments/settings]");
    }
}
async function adminUpdateSettings(req, res) {
    const adminId = requireUserId(req, res);
    if (!adminId)
        return;
    try {
        const input = payment_schema_1.updatePaymentSettingsSchema.parse(req.body);
        const settings = await paymentsService.updateSettings(adminId, input);
        return res.json({ settings });
    }
    catch (error) {
        return handlePaymentError(res, error, "[PUT /admin/payments/settings]");
    }
}
function adminAction(action, context) {
    return async (req, res) => {
        const adminId = requireUserId(req, res);
        if (!adminId)
            return;
        try {
            const payment = await action(adminId, req.params.id, req);
            return res.json({ payment });
        }
        catch (error) {
            return handlePaymentError(res, error, context);
        }
    };
}
exports.adminRelease = adminAction((adminId, id) => paymentsService.adminReleaseEscrow(adminId, id), "[POST /admin/payments/:id/release]");
exports.adminRefund = adminAction((adminId, id) => paymentsService.adminRefundEscrow(adminId, id), "[POST /admin/payments/:id/refund]");
