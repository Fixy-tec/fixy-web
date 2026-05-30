import { Request, Response } from "express";
import * as ratingsService from "../services/ratings.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { createRatingSchema, updateRatingSchema } from "../../../validators/rating.schema";
import { ZodError } from "zod";

export async function createRating(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const raterId = authReq.user?.userId;
    if (!raterId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate input
    const validatedData = createRatingSchema.parse(req.body);

    const result = await ratingsService.createRating({
      applicationId: validatedData.applicationId,
      raterId,
      stars: validatedData.stars,
      comment: validatedData.comment,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message || "Validation error",
      });
    }
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

    // Validate input
    const validatedData = updateRatingSchema.parse(req.body);

    const result = await ratingsService.updateRating(id, userId, {
      stars: validatedData.stars,
      comment: validatedData.comment,
    });

    return res.json(result);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message || "Validation error",
      });
    }
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

/**
 * POST /api/ratings/applicant - Crear rating del aplicante al creador
 */
export async function createApplicantRating(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const applicantId = authReq.user?.userId;
    if (!applicantId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate input
    const validatedData = createRatingSchema.parse(req.body);

    const result = await ratingsService.createApplicantRating({
      applicationId: validatedData.applicationId,
      raterId: applicantId,
      stars: validatedData.stars,
      comment: validatedData.comment,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message || "Validation error",
      });
    }
    return res.status(400).json({ message: error.message || "Failed to create rating" });
  }
}
