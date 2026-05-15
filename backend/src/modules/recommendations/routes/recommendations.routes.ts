import { Router } from "express";
import * as recommendationsController from "../controllers/recommendations.controller";
import { authenticateJWT } from "../../../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Get recommended requests for current user (tag-based)
router.get("/requests", recommendationsController.getRecommendedRequests);

// Get recommended applicants for a request (tag-based)
router.get("/:requestId/applicants", recommendationsController.getRecommendedApplicants);

// Get match percentage between user and request
router.get("/:userId/:requestId/match", recommendationsController.getMatchPercentage);

export default router;
