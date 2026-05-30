import { Router } from "express";
import * as notificationsController from "../controllers/notifications.controller";
import { authenticateJWT } from "../../../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticateJWT, notificationsController.listMyNotifications);
router.delete("/", authenticateJWT, notificationsController.clearMyNotifications);
router.delete(
  "/:id",
  authenticateJWT,
  notificationsController.deleteMyNotification,
);

export default router;
