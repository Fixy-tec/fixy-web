import { Request, Response } from "express";
import * as tagService from "../services/tag.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

export async function getTags(_req: Request, res: Response) {
  const tags = await tagService.getTags();
  return res.json({ tags });
}

export async function getTagById(req: Request, res: Response) {
  const tag = await tagService.getTagById(req.params.id);
  if (!tag) {
    return res.status(404).json({ message: "Tag not found" });
  }
  return res.json({ tag });
}

export async function createTag(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  if (!authReq.user || authReq.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden - Admin only" });
  }

  const { name, isCustom } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Tag name is required" });
  }

  const tag = await tagService.createTag(name, isCustom || false);
  return res.status(201).json({ tag });
}

export async function deleteTag(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  if (!authReq.user || authReq.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden - Admin only" });
  }

  const tag = await tagService.deleteTag(req.params.id);
  return res.json({ tag });
}
