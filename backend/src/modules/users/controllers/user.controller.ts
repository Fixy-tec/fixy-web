import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { ZodError } from "zod";

import { updateProfileSchema }
from "../../../validators/user.schema";

export async function getCurrentUser(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await userService.getCurrentUser(userId);
  return res.json({ user });
}

export async function updateCurrentUser(
  req: Request,
  res: Response
) {
  try {

    const authReq = req as AuthRequest;

    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const validatedData =
      updateProfileSchema.parse(req.body);

    const user =
      await userService.updateCurrentUser(
        userId,
        {
          name: validatedData.name,
          avatarUrl: validatedData.avatarUrl,
          whatsapp: validatedData.whatsapp,
          bio: validatedData.bio,
          portfolioUrl: validatedData.portfolioUrl,
          linkedinUrl: validatedData.linkedinUrl,
          githubUrl: validatedData.githubUrl,
          tags: validatedData.tagIds,
        }
      );

    return res.json({ user });

  } catch (error: any) {

    if (error instanceof ZodError) {
      const first = error.issues[0];
      const field = first?.path?.join(".") || "body";
      const message = first?.message || "Invalid payload";
      console.error("[PATCH /users/me] Zod error:", error.issues);
      return res.status(400).json({
        message: `${field}: ${message}`,
        field,
        issues: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    if (error instanceof userService.InvalidTagNamesError) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof userService.UsernameTakenError) {
      return res.status(409).json({ message: error.message });
    }

    console.error("[PATCH /users/me] Unexpected error:", error);
    return res.status(400).json({
      message:
        error.message ||
        "Failed to update profile",
    });
  }
}


export async function getUsers(_req: Request, res: Response) {
  const users = await userService.getUsers();
  return res.json({ users });
}

export async function getUserById(req: Request, res: Response) {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user });
}
