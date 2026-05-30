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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getUserById(req: Request, res: Response) {
  const id = req.params.id;
  // Guarda: si el `id` no parece UUID es casi seguro que la ruta dinámica
  // está capturando algo que debería ser una sub-ruta (ej: `/users/ranking`
  // si el orden de rutas se rompió). Devolvemos 400 para fallar rápido en
  // vez de un `404 User not found` confuso.
  if (!UUID_REGEX.test(id)) {
    return res
      .status(400)
      .json({ message: `Invalid user id: '${id}' is not a UUID` });
  }
  try {
    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user });
  } catch (error: any) {
    console.error("[GET /users/:id] error:", error);
    return res
      .status(500)
      .json({ message: error?.message ?? "Failed to load user" });
  }
}

/**
 * GET /users/ranking
 * Query: ?limit=50&medal=ORO
 * Devuelve el top global (o por medalla) de usuarios activos ordenados por
 * puntos. Cada entrada incluye `rank` (posición), `points`, `medal`,
 * `completedRequests` y datos de `profile` para mostrar avatar/carrera.
 */
export async function getRanking(req: Request, res: Response) {
  try {
    const limitRaw = req.query.limit;
    const medalRaw = req.query.medal;

    const limit =
      typeof limitRaw === "string" && !Number.isNaN(Number(limitRaw))
        ? Number(limitRaw)
        : undefined;
    const medal = typeof medalRaw === "string" ? medalRaw : undefined;

    const ranking = await userService.getUsersRanking({ limit, medal });
    return res.json({ ranking });
  } catch (error: any) {
    console.error("[GET /users/ranking] error:", error);
    return res
      .status(500)
      .json({ message: error?.message ?? "Failed to load ranking" });
  }
}
