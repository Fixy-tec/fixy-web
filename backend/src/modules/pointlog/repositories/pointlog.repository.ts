import prisma from "../../../prisma";
import { PointLog, Medal } from "@prisma/client";

export interface CreatePointLogInput {
  userId: string;
  delta: number;
  reason: string;
  ratingId?: string;
  requestId?: string;
}

export interface GetPointLogsFilters {
  userId?: string;
  ratingId?: string;
  requestId?: string;
}

/**
 * Crear un registro de puntos
 */
export async function createPointLog(
  input: CreatePointLogInput
): Promise<PointLog> {
  // Obtener usuario actual para determinar medalla antes
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const medalBefore = user.medal;
  const newPoints = Math.max(0, user.points + input.delta);
  const medalAfter = await getMedalByPoints(newPoints);

  return prisma.pointLog.create({
    data: {
      userId: input.userId,
      delta: input.delta,
      reason: input.reason,
      ratingId: input.ratingId,
      requestId: input.requestId,
      medalBefore,
      medalAfter,
    },
  });
}

/**
 * Obtener registros de puntos con filtros
 */
export async function getPointLogs(
  filters?: GetPointLogsFilters
): Promise<PointLog[]> {
  return prisma.pointLog.findMany({
    where: {
      userId: filters?.userId,
      ratingId: filters?.ratingId,
      requestId: filters?.requestId,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Obtener historial de puntos de un usuario
 */
export async function getUserPointHistory(
  userId: string,
  limit: number = 20
): Promise<PointLog[]> {
  return prisma.pointLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Obtener estadísticas de puntos de un usuario
 */
export async function getUserPointStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      points: true,
      medal: true,
      pointLogs: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const totalPointsGained = user.pointLogs.reduce((sum, log) => {
    return sum + (log.delta > 0 ? log.delta : 0);
  }, 0);

  const totalPointsLost = user.pointLogs.reduce((sum, log) => {
    return sum + (log.delta < 0 ? Math.abs(log.delta) : 0);
  }, 0);

  return {
    userId: user.id,
    currentPoints: user.points,
    currentMedal: user.medal,
    totalPointsGained,
    totalPointsLost,
    netPoints: totalPointsGained - totalPointsLost,
    activityCount: user.pointLogs.length,
  };
}

/**
 * Obtener la medalla correspondiente a puntos (función auxiliar)
 */
async function getMedalByPoints(points: number): Promise<Medal> {
  const medals: Record<string, { min: number; max: number }> = {
    HIERRO: { min: 0, max: 299 },
    BRONCE: { min: 300, max: 799 },
    PLATA: { min: 800, max: 1799 },
    ORO: { min: 1800, max: 3499 },
    DIAMANTE: { min: 3500, max: 5999 },
    MAESTRO: { min: 6000, max: 9999 },
    CHALLENGER: { min: 10000, max: Infinity },
  };

  for (const [medal, range] of Object.entries(medals)) {
    if (points >= range.min && points <= range.max) {
      return medal as Medal;
    }
  }

  return "CHALLENGER";
}
