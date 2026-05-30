import { Request, Response } from "express";
import * as requestsService from "../services/requests.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { RequestType, RequestStatus } from "@prisma/client";
import { ZodError } from "zod";
import { createRequestSchema }
from "../../../validators/request.schema";

export async function createRequest(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = createRequestSchema.parse(req.body);

    const result =
      await requestsService.createRequest({
        creatorId: userId,

        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        difficulty: validatedData.difficulty,
        basePoints: validatedData.basePoints,
        economicBenefit: validatedData.economicBenefit,

        tagIds: validatedData.tagIds,

        deadline: validatedData.deadline
          ? new Date(validatedData.deadline)
          : undefined,

        participantsNeeded:
          validatedData.participantsNeeded || 1,
      });

    return res.status(201).json({ request: result });

  } catch (error: any) {

    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message,
      });
    }

    if (error instanceof requestsService.InvalidTagIdsError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(400).json({
      message:
        error.message ||
        "Failed to create request",
    });
  }
}


export async function getRequests(req: Request, res: Response) {
  try {
    const { type, status, creatorId } = req.query;

    const filters: any = {};
    if (type && Object.values(RequestType).includes(type as RequestType)) {
      filters.type = type;
    }
    if (status && Object.values(RequestStatus).includes(status as RequestStatus)) {
      filters.status = status;
    }
    if (creatorId) {
      filters.creatorId = creatorId;
    }

    const requests = await requestsService.getRequests(filters);
    return res.json({ requests });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to get requests" });
  }
}

export async function getRequestById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const request = await requestsService.getRequestById(id);
    return res.json({ request });
  } catch (error: any) {
    return res.status(404).json({ message: error.message || "Request not found" });
  }
}

export async function updateRequest(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { type, title, description, difficulty, basePoints, economicBenefit, participantsNeeded, deadline, status, tagIds } = req.body;

    // Verify ownership
    const request = await requestsService.getRequestById(id);
    if (request.creatorId !== userId) {
      return res.status(403).json({ message: "You can only update your own requests" });
    }

    const updateData: any = {
      type,
      title,
      description,
      difficulty,
      basePoints,
      economicBenefit,
      participantsNeeded,
      deadline: deadline ? new Date(deadline) : undefined,
      status,
      tagIds: tagIds ? (Array.isArray(tagIds) ? tagIds : [tagIds]) : undefined,
    };

    const result = await requestsService.updateRequest(id, updateData);
    return res.json({ request: result });
  } catch (error: any) {
    if (error instanceof requestsService.InvalidTagIdsError) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message || "Failed to update request" });
  }
}

export async function deleteRequest(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    // Verify ownership
    const request = await requestsService.getRequestById(id);
    if (request.creatorId !== userId) {
      return res.status(403).json({ message: "You can only delete your own requests" });
    }

    await requestsService.deleteRequest(id);
    return res.json({ message: "Request deleted successfully" });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to delete request" });
  }
}

/**
 * POST /requests/:id/extend-deadline
 * Body: { deadline: ISO string }
 * Sólo el dueño puede aplazar. Valida que newDeadline > current.
 */
export async function extendDeadline(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { deadline } = req.body as { deadline?: string };

    if (!deadline || typeof deadline !== "string") {
      return res.status(400).json({ message: "El campo 'deadline' es obligatorio" });
    }

    const parsed = new Date(deadline);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ message: "Fecha inválida" });
    }

    // Verify ownership
    const request = await requestsService.getRequestById(id);
    if (request.creatorId !== userId) {
      return res.status(403).json({ message: "You can only update your own requests" });
    }

    const updated = await requestsService.extendDeadline(id, parsed);
    return res.json({ request: updated });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to extend deadline" });
  }
}
