import { Request, Response } from "express";
import * as notificationsService from "../services/notifications.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

/**
 * GET /api/notifications?limit=20
 * Lista las notificaciones del usuario autenticado (más recientes primero).
 */
export async function listMyNotifications(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limitRaw = req.query.limit;
    const limit =
      typeof limitRaw === "string" && !Number.isNaN(Number(limitRaw))
        ? Math.max(1, Math.min(Number(limitRaw), 50))
        : undefined;

    const notifications = await notificationsService.getMyNotifications(
      userId,
      limit,
    );
    return res.json({ notifications });
  } catch (error: any) {
    console.error("[GET /notifications] error:", error);
    return res
      .status(500)
      .json({ message: error?.message ?? "Failed to load notifications" });
  }
}

/**
 * DELETE /api/notifications/:id
 * "Marcar como visto" → elimina la notificación.
 */
export async function deleteMyNotification(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await notificationsService.deleteMyNotification(req.params.id, userId);
    return res.status(204).send();
  } catch (error: any) {
    if (error?.message === "Notification not found") {
      return res.status(404).json({ message: "Notification not found" });
    }
    console.error("[DELETE /notifications/:id] error:", error);
    return res
      .status(500)
      .json({ message: error?.message ?? "Failed to delete notification" });
  }
}

/**
 * DELETE /api/notifications
 * Borra todas las notificaciones del usuario.
 */
export async function clearMyNotifications(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deleted = await notificationsService.clearMyNotifications(userId);
    return res.json({ deleted });
  } catch (error: any) {
    console.error("[DELETE /notifications] error:", error);
    return res
      .status(500)
      .json({ message: error?.message ?? "Failed to clear notifications" });
  }
}
