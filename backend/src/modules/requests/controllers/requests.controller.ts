import { Request, Response } from "express";
import * as requestsService from "../services/requests.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { RequestType, RequestStatus } from "@prisma/client";

function normalizeTagIdsFromBody(body: Record<string, unknown>): string[] {
  const raw = body.tagIds ?? body.tags;
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((id) => String(id).trim()).filter((id) => id.length > 0);
}

function parseDeadline(value: unknown): Date | undefined {
  if (value == null || value === "") return undefined;
  const str = String(value);
  // Acepta "YYYY-MM-DD" del input date o ISO completo
  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(str)
      ? new Date(`${str}T23:59:59.000Z`)
      : new Date(str);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha límite inválida");
  }
  return date;
}

export async function createRequest(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as Record<string, unknown>;
    const {
      type,
      title,
      description,
      difficulty,
      basePoints,
      economicBenefit,
      participantsNeeded,
      deadline,
    } = body;

    const tagIdsList = normalizeTagIdsFromBody(body);
    const missing: string[] = [];

    if (!type) missing.push("type");
    if (!title || !String(title).trim()) missing.push("title");
    if (!description || !String(description).trim()) missing.push("description");
    if (difficulty == null || difficulty === "") missing.push("difficulty");
    if (basePoints == null || basePoints === "") missing.push("basePoints");
    if (tagIdsList.length === 0) missing.push("tagIds");

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Faltan campos obligatorios: ${missing.join(", ")}`,
        fields: missing,
      });
    }

    const difficultyNum = Number(difficulty);
    const basePointsNum = Number(basePoints);
    const invalid: string[] = [];
    if (Number.isNaN(difficultyNum)) invalid.push("difficulty");
    if (Number.isNaN(basePointsNum)) invalid.push("basePoints");
    if (invalid.length > 0) {
      return res.status(400).json({
        message: `Campos inválidos: ${invalid.join(", ")}`,
        fields: invalid,
      });
    }

    const result = await requestsService.createRequest({
      creatorId: userId,
      type: type as RequestType,
      title: String(title).trim(),
      description: String(description).trim(),
      difficulty: difficultyNum,
      basePoints: basePointsNum,
      economicBenefit:
        economicBenefit != null && economicBenefit !== ""
          ? Number(economicBenefit)
          : undefined,
      participantsNeeded: participantsNeeded
        ? Number(participantsNeeded)
        : 1,
      deadline: parseDeadline(deadline),
      tagIds: tagIdsList,
    });

    return res.status(201).json({ request: result });
  } catch (error: any) {
    if (error instanceof requestsService.InvalidTagIdsError) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message || "Failed to create request" });
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
    const {
      type,
      title,
      description,
      difficulty,
      basePoints,
      economicBenefit,
      participantsNeeded,
      deadline,
      status,
      tagIds,
    } = req.body;

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
      tagIds: tagIds
        ? Array.isArray(tagIds)
          ? tagIds
          : [tagIds]
        : undefined,
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
