import { Router } from "express";
import { login, register, logout } from "../modules/auth/controllers/auth.controller";
import { loginRateLimiter } from "../middlewares/rate-limit.middleware";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();
router.post("/register", register);
router.post("/login", loginRateLimiter, login);
router.post("/logout", authenticateJWT, logout);

export default router;
