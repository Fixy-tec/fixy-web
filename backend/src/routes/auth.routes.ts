import { Router } from "express";
import { login, register } from "../modules/auth/controllers/auth.controller";
import { loginRateLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();
router.post("/register", register);
router.post("/login", loginRateLimiter, login);

export default router;
