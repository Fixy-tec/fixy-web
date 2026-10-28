import { Router } from "express";
import { authenticateJWT } from "../../../middlewares/auth.middleware";
import { paymentRateLimiter } from "../../../middlewares/rate-limit.middleware";
import * as paymentsController from "../controllers/payments.controller";

const router = Router();

// Público: precios y límites (página de planes).
router.get("/config", paymentsController.getConfig);

router.use(authenticateJWT);

router.get("/me", paymentsController.getMine);
router.get("/escrow/request/:requestId", paymentsController.getEscrowForRequest);
router.post("/plan/card", paymentRateLimiter, paymentsController.payPlanCard);
router.post("/escrow/card", paymentRateLimiter, paymentsController.payEscrowCard);
router.get("/:id", paymentsController.getPayment);

export default router;
