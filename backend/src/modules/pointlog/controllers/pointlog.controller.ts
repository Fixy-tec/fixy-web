import { Request, Response } from "express";
import * as pointlogService from "../services/pointlog.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

/**
 * GET /api/pointlog/me - Obtener historial de puntos del usuario autenticado
 */
export async function getUserPointHistory(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const pointHistory = await pointlogService.getUserPointHistory(userId, limit);
    return res.json({ pointHistory });
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Failed to get point history" });
  }
}

/**
 * GET /api/pointlog/stats - Obtener estadísticas de puntos del usuario autenticado
 */
export async function getUserPointStats(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const stats = await pointlogService.getUserPointStats(userId);
    return res.json(stats);
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Failed to get point stats" });
  }
}

/**
 * GET /api/pointlog/user/:userId - Obtener historial de puntos de un usuario (público)
 */
export async function getUserPointHistoryPublic(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const pointHistory = await pointlogService.getUserPointHistory(userId, limit);
    return res.json({ pointHistory });
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Failed to get point history" });
  }
}

/**
 * GET /api/pointlog/stats/:userId - Obtener estadísticas de puntos de un usuario (público)
 */
export async function getUserPointStatsPublic(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const stats = await pointlogService.getUserPointStats(userId);
    return res.json(stats);
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Failed to get point stats" });
  }
}

/**
 * GET /api/pointlog/filter - Obtener registros con filtros (admin)
 */
export async function getPointLogs(req: Request, res: Response) {
  try {
    const { userId, ratingId, requestId } = req.query;

    const pointLogs = await pointlogService.getPointLogs({
      userId: userId as string,
      ratingId: ratingId as string,
      requestId: requestId as string,
    });

    return res.json({ pointLogs });
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Failed to get point logs" });
  }
}
