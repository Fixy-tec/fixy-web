import { Router } from "express";
import { login, register, logout } from "../modules/auth/controllers/auth.controller";
import { loginRateLimiter } from "../middlewares/rate-limit.middleware";
import { authenticateJWT } from "../middlewares/auth.middleware";
import * as authController from "../modules/auth/controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { registerSchema } from "../validators/auth.schema";

const router = Router();
router.post(
  "/register",
  validate(registerSchema),
  authController.register
);
router.post("/login", loginRateLimiter, login);
router.post("/logout", authenticateJWT, logout);

export default router;