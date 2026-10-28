"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanRequiredError = exports.PlanLimitError = exports.FREE_LIMITS = void 0;
exports.isProActive = isProActive;
exports.effectivePlan = effectivePlan;
exports.extendPlanExpiry = extendPlanExpiry;
exports.commissionFor = commissionFor;
/** Límites del plan Free. Pro no tiene límites. */
exports.FREE_LIMITS = {
    activeRequests: 3,
    applicationsPerWeek: 5,
};
/** Pro solo cuenta mientras no haya vencido. */
function isProActive(user, now = new Date()) {
    return (user.plan === "PRO" &&
        user.planExpiresAt != null &&
        user.planExpiresAt.getTime() > now.getTime());
}
function effectivePlan(user) {
    return isProActive(user) ? "PRO" : "FREE";
}
/** Nueva fecha de vencimiento: si ya es Pro, se suma al tiempo que le queda. */
function extendPlanExpiry(current, period, now = new Date()) {
    const base = current && current.getTime() > now.getTime() ? new Date(current) : new Date(now);
    if (period === "YEARLY")
        base.setFullYear(base.getFullYear() + 1);
    else
        base.setMonth(base.getMonth() + 1);
    return base;
}
/** Comisión en céntimos: Pro no paga comisión. */
function commissionFor(amountCents, payeeIsPro, freeCommissionBps) {
    if (payeeIsPro)
        return 0;
    return Math.round((amountCents * freeCommissionBps) / 10000);
}
class PlanLimitError extends Error {
    constructor(message) {
        super(message);
        this.code = "PLAN_LIMIT_REACHED";
        this.name = "PlanLimitError";
    }
}
exports.PlanLimitError = PlanLimitError;
class PlanRequiredError extends Error {
    constructor(message = "Esta función es exclusiva del plan Pro") {
        super(message);
        this.code = "PLAN_REQUIRED";
        this.name = "PlanRequiredError";
    }
}
exports.PlanRequiredError = PlanRequiredError;
