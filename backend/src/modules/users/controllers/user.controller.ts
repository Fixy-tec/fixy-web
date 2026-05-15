import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

export async function getCurrentUser(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await userService.getCurrentUser(userId);
  return res.json({ user });
}

export async function updateCurrentUser(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { avatarUrl, whatsapp, bio, portfolioUrl, linkedinUrl, githubUrl, tags } = req.body;
  if (!whatsapp) {
    return res.status(400).json({ message: "WhatsApp is required" });
  }
  try {
    const user = await userService.updateCurrentUser(userId, {
      avatarUrl,
      whatsapp,
      bio,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      tags,
    });
    return res.json({ user });
  } catch (err) {
    if (err instanceof userService.InvalidTagNamesError) {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
}

export async function getUsers(_req: Request, res: Response) {
  const users = await userService.getUsers();
  return res.json({ users });
}

export async function getUserById(req: Request, res: Response) {
  const user = await userService.getCurrentUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }
  return res.json({ user });
}
