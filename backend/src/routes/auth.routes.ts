import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth.middleware";
import * as authController from "../modules/auth/controllers/auth.controller";

const router = Router();

router.get("/google", authController.googleLogin);
router.post("/google/callback", authController.googleCallback);
router.get("/google/callback", authController.googleCallback);
router.post("/logout", authenticateJWT, authController.logout);
router.get("/me", authenticateJWT, authController.me);

export default router;
