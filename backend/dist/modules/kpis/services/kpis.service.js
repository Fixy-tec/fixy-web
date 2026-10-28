"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIMULATION_INVESTMENT_CENTS = void 0;
exports.computeRoi = computeRoi;
exports.getRoiReport = getRoiReport;
const prisma_1 = __importDefault(require("../../../prisma"));
/**
 * Inversión fija del proyecto (S/ 441), definida por el dueño. El ROI que se
 * muestra es una SIMULACIÓN: hoy todos los pagos son de la pasarela en modo
 * demo (TEST). Cuando existan pagos reales, este reporte deberá separarlos.
 */
exports.SIMULATION_INVESTMENT_CENTS = 44100;
/** ROI = (Ingresos − Inversión) / Inversión. */
function computeRoi(revenueCents, investmentCents) {
    return (revenueCents - investmentCents) / investmentCents;
}
/**
 * Lo que la app gana con cada pago:
 *   - plan Pro aprobado → el monto completo
 *   - asesoría liberada → solo la comisión (el resto es del ayudante)
 */
function appIncomeOf(p) {
    return p.purpose === "PLAN_SUBSCRIPTION" ? p.amountCents : p.commissionCents;
}
async function getRoiReport() {
    const investmentCents = exports.SIMULATION_INVESTMENT_CENTS;
    const [payments, activeProUsers, settings] = await Promise.all([
        prisma_1.default.payment.findMany({
            where: {
                OR: [
                    { purpose: "PLAN_SUBSCRIPTION", status: "APPROVED" },
                    { purpose: "ASESORIA_ESCROW", status: "RELEASED" },
                ],
            },
            select: {
                id: true,
                code: true,
                purpose: true,
                description: true,
                planPeriod: true,
                amountCents: true,
                commissionCents: true,
                createdAt: true,
                reviewedAt: true,
                releasedAt: true,
            },
        }),
        prisma_1.default.user.count({ where: { plan: "PRO", planExpiresAt: { gt: new Date() } } }),
        prisma_1.default.paymentSettings.findUnique({ where: { id: 1 } }),
    ]);
    // Cada venta en orden: el ingreso acumulado sube un escalón y el ROI se recalcula.
    const sales = payments
        .map((p) => ({
        id: p.id,
        code: p.code,
        purpose: p.purpose,
        description: p.description,
        incomeCents: appIncomeOf(p),
        at: p.purpose === "PLAN_SUBSCRIPTION" ? (p.reviewedAt ?? p.createdAt) : (p.releasedAt ?? p.createdAt),
    }))
        .filter((s) => s.incomeCents > 0)
        .sort((a, b) => a.at.getTime() - b.at.getTime());
    let cumulative = 0;
    const steps = sales.map((s, i) => {
        cumulative += s.incomeCents;
        return {
            index: i + 1,
            at: s.at,
            code: s.code,
            description: s.description,
            incomeCents: s.incomeCents,
            cumulativeRevenueCents: cumulative,
            roi: computeRoi(cumulative, investmentCents),
        };
    });
    const revenueCents = cumulative;
    const plansCents = sales
        .filter((s) => s.purpose === "PLAN_SUBSCRIPTION")
        .reduce((n, s) => n + s.incomeCents, 0);
    const proMonthlyCents = settings?.proMonthlyCents ?? 990;
    const proYearlyCents = settings?.proYearlyCents ?? 8990;
    const remainingCents = Math.max(0, investmentCents - revenueCents);
    return {
        formula: "ROI = (Ingresos − Inversión) / Inversión",
        investmentCents,
        revenueCents,
        profitCents: revenueCents - investmentCents,
        roi: computeRoi(revenueCents, investmentCents),
        /** Fracción de la inversión ya recuperada (1 = recuperada). */
        recovered: revenueCents / investmentCents,
        remainingCents,
        /** Cuántas ventas más hacen falta para recuperar la inversión. */
        salesToBreakEven: {
            yearlyPlans: Math.ceil(remainingCents / proYearlyCents),
            monthlyPlans: Math.ceil(remainingCents / proMonthlyCents),
        },
        revenue: {
            plansCents,
            commissionsCents: revenueCents - plansCents,
        },
        plansSold: sales.filter((s) => s.purpose === "PLAN_SUBSCRIPTION").length,
        activeProUsers,
        breakEvenSale: steps.find((s) => s.cumulativeRevenueCents >= investmentCents)?.index ?? null,
        steps,
        prices: { proMonthlyCents, proYearlyCents },
    };
}
