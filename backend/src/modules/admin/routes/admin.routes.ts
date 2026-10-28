import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { adminMiddleware } from "../../../middlewares/admin.middleware";
import * as paymentsController from "../../payments/controllers/payments.controller";
import * as kpisController from "../../kpis/controllers/kpis.controller";

const router = Router();

router.use(adminMiddleware);

router.get("/dashboard", adminController.getDashboard);
router.get("/logs", adminController.listLogs);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

// Pagos
router.get("/payments", paymentsController.adminList);
router.get("/payments/summary", paymentsController.adminSummary);
router.get("/payments/settings", paymentsController.adminGetSettings);
router.put("/payments/settings", paymentsController.adminUpdateSettings);
router.post("/payments/:id/release", paymentsController.adminRelease);
router.post("/payments/:id/refund", paymentsController.adminRefund);

// Indicadores (KPIs)
router.get("/kpis/roi", kpisController.getRoi);

export default router;
