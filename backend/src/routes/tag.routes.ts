import { Router } from "express";
import {
  getTags,
  getTagById,
  createTag,
  deleteTag,
} from "../modules/tags/controllers/tag.controller";
import { authenticateJWT, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Get all tags (public)
router.get("/", getTags);

// Get tag by id (public)
router.get("/:id", getTagById);

// Create tag (admin only)
router.post("/", authenticateJWT, requireRole("ADMIN"), createTag);

// Delete tag (admin only)
router.delete("/:id", authenticateJWT, requireRole("ADMIN"), deleteTag);

export default router;
