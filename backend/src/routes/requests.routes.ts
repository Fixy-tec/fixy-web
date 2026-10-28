import { Router } from "express";
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  extendDeadline,
  completeRequest,
} from "../modules/requests/controllers/request.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.get("/", getRequests);
router.get("/:id", getRequestById);

// Protected routes
router.post("/", authenticateJWT, createRequest);
router.patch("/:id", authenticateJWT, updateRequest);
router.delete("/:id", authenticateJWT, deleteRequest);
router.post("/:id/extend-deadline", authenticateJWT, extendDeadline);
router.post("/:id/complete", authenticateJWT, completeRequest);

export default router;
