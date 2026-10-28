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
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../../../middlewares/rate-limit.middleware");
const paymentsController = __importStar(require("../controllers/payments.controller"));
const router = (0, express_1.Router)();
// Público: precios y límites (página de planes).
router.get("/config", paymentsController.getConfig);
router.use(auth_middleware_1.authenticateJWT);
router.get("/me", paymentsController.getMine);
router.get("/escrow/request/:requestId", paymentsController.getEscrowForRequest);
router.post("/plan/card", rate_limit_middleware_1.paymentRateLimiter, paymentsController.payPlanCard);
router.post("/escrow/card", rate_limit_middleware_1.paymentRateLimiter, paymentsController.payEscrowCard);
router.get("/:id", paymentsController.getPayment);
exports.default = router;
