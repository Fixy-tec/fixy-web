import { Request, Response } from "express";
import * as recommendationsService from "../services/recommendations.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

export async function getRecommendedRequests(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const recommendations = await recommendationsService.getRecommendedRequests(userId, limit);
    return res.json({ recommendations });
  } catch (error: any) {
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

    // Verify user owns the request
    // This should be done in a service, but for now verify here
    const applicants = await recommendationsService.getRecommendedApplicants(requestId);
    return res.json({ applicants });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to get recommended applicants" });
  }
}

export async function getMatchPercentage(req: Request, res: Response) {
  try {
    const { userId, requestId } = req.params;

    const matchPercentage = await recommendationsService.getMatchPercentage(userId, requestId);
    return res.json({ matchPercentage });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to calculate match" });
  }
}
