import { Request, Response } from "express";
import * as recommendationsService from "../services/recommendations.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { ZodError } from "zod";
import { getRecommendedRequestsSchema } from "../../../validators/recommendations.schema";

export async function getRecommendedRequests(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate query parameters
    const validated = getRecommendedRequestsSchema.parse(req.query);
    const limit = validated.limit;

    const recommendations = await recommendationsService.getRecommendedRequests(userId, limit);
    return res.json({ recommendations });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message || "Invalid query parameters",
      });
    }
    return res.status(400).json({ message: error.message || "Failed to get recommendations" });
  }
}

export async function getRecommendedApplicants(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { requestId } = req.params;

    // Verify user owns the request (security check)
    const isOwner = await recommendationsService.verifyRequestOwnership(requestId, userId);
    if (!isOwner) {
      return res.status(403).json({ message: "Forbidden: You can only view applicants for your own requests" });
    }

    const applicants = await recommendationsService.getRecommendedApplicants(requestId);
    return res.json({ applicants });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to get recommended applicants" });
  }
}

export async function getMatchPercentage(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const authenticatedUserId = authReq.user?.userId;
    if (!authenticatedUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, requestId } = req.params;

    // Security: only allow user to calculate their own match percentage
    if (userId !== authenticatedUserId) {
      return res.status(403).json({ message: "Forbidden: You can only view your own match percentage" });
    }

    const matchPercentage = await recommendationsService.getMatchPercentage(userId, requestId);
    return res.json({ matchPercentage });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to calculate match" });
  }
}
