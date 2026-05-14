import { Router } from "express";
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} from "../modules/applications/controllers/applications.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.get("/", getApplications);
router.get("/:id", getApplicationById);

// Protected routes
router.post("/", authenticateJWT, createApplication);
router.patch("/:id", authenticateJWT, updateApplication);
router.delete("/:id", authenticateJWT, deleteApplication);

export default router;
