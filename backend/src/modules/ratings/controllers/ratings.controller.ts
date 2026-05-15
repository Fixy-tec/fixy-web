import { Request, Response } from "express";
import * as ratingsService from "../services/ratings.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

export async function createRating(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const raterId = authReq.user?.userId;
    if (!raterId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { applicationId, stars, comment } = req.body;

    if (!applicationId || stars === undefined) {
      return res.status(400).json({ message: "ApplicationId and stars are required" });
    }

    const result = await ratingsService.createRating({
      applicationId,
      raterId,
      stars,
      comment,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to create rating" });
  }
}

export async function getRating(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const rating = await ratingsService.getRating(id);
    return res.json({ rating });
  } catch (error: any) {
    return res.status(404).json({ message: error.message || "Rating not found" });
  }
}

export async function getRatingsByUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const ratings = await ratingsService.getRatingsByRatedUser(userId);
    return res.json({ ratings });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to get ratings" });
  }
}

export async function updateRating(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { stars, comment } = req.body;

    const result = await ratingsService.updateRating(id, userId, {
      stars,
      comment,
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to update rating" });
  }
}

export async function deleteRating(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    await ratingsService.deleteRating(id, userId);
    return res.json({ message: "Rating deleted successfully" });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to delete rating" });
  }
}
