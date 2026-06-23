import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { adminMiddleware } from "../../../middlewares/admin.middleware";

const router = Router();

router.use(adminMiddleware);

router.get("/dashboard", adminController.getDashboard);
router.get("/logs", adminController.listLogs);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

export default router;
