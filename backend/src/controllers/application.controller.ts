import { Request, Response } from "express";
import * as applicationService from "../services/application.service";

export async function listApplications(_req: Request, res: Response) {
  try {
    const applications = await applicationService.getApplications();
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error listing applications" });
  }
}

export async function createApplication(req: Request, res: Response) {
  try {
    const { requestId, applicantId, message } = req.body;
    if (!requestId || !applicantId || !message) {
      return res.status(400).json({ message: "requestId, applicantId and message are required" });
    }

    const application = await applicationService.createApplication({
      requestId,
      applicantId,
      message,
    });

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating application" });
  }
}
