import express, { Router } from "express";
import * as pointlogController from "../controllers/pointlog.controller";
import { authenticateJWT } from "../../../middlewares/auth.middleware";

const router: Router = express.Router();

// Private routes (require authentication)
router.get("/me/history", authenticateJWT, pointlogController.getUserPointHistory);
router.get("/me/stats", authenticateJWT, pointlogController.getUserPointStats);

// Public routes
router.get("/user/:userId/history", pointlogController.getUserPointHistoryPublic);
router.get("/user/:userId/stats", pointlogController.getUserPointStatsPublic);

// Admin/Utility routes
router.get("/filter", pointlogController.getPointLogs);

export default router;
