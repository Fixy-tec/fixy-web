import * as pointlogRepository from "../repositories/pointlog.repository";
import { PointLog } from "@prisma/client";

export interface CreatePointLogInput {
  userId: string;
  delta: number;
  reason: string;
  ratingId?: string;
  requestId?: string;
}

/**
 * Crear un registro de puntos
 */
export async function createPointLog(
  input: CreatePointLogInput
): Promise<PointLog> {
  if (!input.userId || input.delta === undefined) {
    throw new Error("UserId and delta are required");
  }

  if (typeof input.delta !== "number" || !Number.isInteger(input.delta)) {
    throw new Error("Delta must be an integer");
  }

  if (!input.reason || input.reason.trim().length === 0) {
    throw new Error("Reason cannot be empty");
  }

  const pointLog = await pointlogRepository.createPointLog(input);
  return pointLog;
}

/**
 * Obtener registros de puntos
 */
export async function getPointLogs(filters?: {
  userId?: string;
  ratingId?: string;
  requestId?: string;
}): Promise<PointLog[]> {
  return pointlogRepository.getPointLogs(filters);
}

/**
 * Obtener historial de puntos de un usuario
 */
export async function getUserPointHistory(
  userId: string,
  limit?: number
): Promise<PointLog[]> {
  return pointlogRepository.getUserPointHistory(userId, limit);
}

/**
 * Obtener estadísticas de puntos de un usuario
 */
export async function getUserPointStats(userId: string) {
  return pointlogRepository.getUserPointStats(userId);
}
