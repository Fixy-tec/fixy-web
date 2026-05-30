import { Router } from "express";
import {
  getCurrentUser,
  updateCurrentUser,
  getUsers,
  getUserById,
  getRanking,
} from "../modules/users/controllers/user.controller";
import { authenticateJWT, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", authenticateJWT, getCurrentUser);
router.patch("/me", authenticateJWT, updateCurrentUser);

// IMPORTANTE: `/ranking` debe ir antes de `/:id` para no chocar contra
// el handler dinámico de Express.
router.get("/ranking", authenticateJWT, getRanking);

router.get("/", authenticateJWT, requireRole("ADMIN"), getUsers);
router.get("/:id", authenticateJWT, getUserById);

export default router;
