import { Request, Response } from "express";
import * as applicationsService from "../services/applications.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { ApplicationStatus } from "@prisma/client";

export async function createApplication(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { requestId, message } = req.body;

    if (!requestId || !message) {
      return res.status(400).json({ message: "RequestId and message are required" });
    }

    const result = await applicationsService.createApplication({
      requestId,
      applicantId: userId,
      message,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to create application" });
  }
}

export async function getApplications(req: Request, res: Response) {
  try {
    const { requestId, applicantId, status } = req.query;

    const filters: any = {};
    if (requestId) {
      filters.requestId = requestId;
    }
    if (applicantId) {
      filters.applicantId = applicantId;
    }
    if (status && Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
      filters.status = status;
    }

    const applications = await applicationsService.getApplications(filters);
    return res.json({ applications });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to get applications" });
  }
}

export async function getApplicationById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const application = await applicationsService.getApplicationById(id);
    return res.json({ application });
  } catch (error: any) {
    return res.status(404).json({ message: error.message || "Application not found" });
  }
}

export async function updateApplication(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status, message } = req.body;

    const application = await applicationsService.getApplicationById(id);

    // Only the request creator can update status, applicant can update message
    if (status && application.request.creatorId !== userId) {
      return res.status(403).json({ message: "Only the request creator can update status" });
    }

    if (message && application.applicantId !== userId) {
      return res.status(403).json({ message: "You can only update your own applications" });
    }

    const result = await applicationsService.updateApplication(id, { status, message });
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to update application" });
  }
}

export async function deleteApplication(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const application = await applicationsService.getApplicationById(id);

    // Only applicant or request creator can delete
    if (application.applicantId !== userId && application.request.creatorId !== userId) {
      return res.status(403).json({ message: "You can only delete your own applications" });
    }

    await applicationsService.deleteApplication(id);
    return res.json({ message: "Application deleted successfully" });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to delete application" });
  }
}
