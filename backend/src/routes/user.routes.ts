import { Router } from "express";
import {
  getCurrentUser,
  updateCurrentUser,
  getUsers,
  getUserById,
} from "../modules/users/controllers/user.controller";
import { authenticateJWT, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", authenticateJWT, getCurrentUser);
router.patch("/me", authenticateJWT, updateCurrentUser);

router.get("/", authenticateJWT, requireRole("ADMIN"), getUsers);
router.get("/:id", authenticateJWT, requireRole("ADMIN"), getUserById);

export default router;
