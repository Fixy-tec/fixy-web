/**
 * Sistema de Reputación por Puntos y Medallas
 * 
 * Puntos Base por Dificultad:
 * - Nivel 1: 50 puntos
 * - Nivel 2: 100 puntos
 * - Nivel 3: 180 puntos
 * - Nivel 4: 280 puntos
 * - Nivel 5: 400 puntos
 * 
 * Bonificación por Creador: +20% de puntos base
 * 
 * Modificadores por Calificación:
 * - 5 stars: x1.5 (excelencia)
 * - 4 stars: x1.2 (bonificación)
 * - 3 stars: x1.0 (sin modificador)
 * - 2 stars: -30 puntos (penalización leve)
 * - 1 stars: -80 puntos (penalización grave)
 */

import { Medal } from "@prisma/client";

// Puntos base por nivel de dificultad
const BASE_POINTS_BY_DIFFICULTY: Record<number, number> = {
  1: 50,
  2: 100,
  3: 180,
  4: 280,
  5: 400,
};

// Modificador por ser creador del request
const CREATOR_BONUS_PERCENTAGE = 0.2; // 20%

// Modificadores por calificación (stars)
const RATING_MODIFIERS: Record<number, number | null> = {
  5: 1.5,     // x1.5
  4: 1.2,     // x1.2
  3: 1.0,     // x1.0 (sin cambio)
  2: -30,     // -30 puntos
  1: -80,     // -80 puntos
};

// Tabla de medallas
export const MEDAL_RANGES: Record<Medal, { min: number; max: number }> = {
  HIERRO: { min: 0, max: 299 },
  BRONCE: { min: 300, max: 799 },
  PLATA: { min: 800, max: 1799 },
  ORO: { min: 1800, max: 3499 },
  DIAMANTE: { min: 3500, max: 5999 },
  MAESTRO: { min: 6000, max: 9999 },
  CHALLENGER: { min: 10000, max: Infinity },
};

export const MEDAL_ORDER: Medal[] = [
  "HIERRO",
  "BRONCE",
  "PLATA",
  "ORO",
  "DIAMANTE",
  "MAESTRO",
  "CHALLENGER",
];

/**
 * Obtener puntos base según dificultad
 */
export function getBasePoints(difficulty: number): number {
  if (difficulty < 1 || difficulty > 5) {
    throw new Error("Difficulty must be between 1 and 5");
  }
  return BASE_POINTS_BY_DIFFICULTY[difficulty];
}

/**
 * Calcular puntos para un aplicante en base a una calificación
 * 
 * @param basePoints Puntos base del request
 * @param stars Calificación (1-5)
 * @returns Puntos a otorgar (puede ser negativo)
 */
export function calculateApplicantPoints(basePoints: number, stars: number): number {
  if (stars < 1 || stars > 5) {
    throw new Error("Stars must be between 1 and 5");
  }

  const modifier = RATING_MODIFIERS[stars];

  // Para 2 y 1 stars, se aplica una penalización fija (negativa)
  if (modifier && modifier < 1) {
    return modifier;
  }

  // Para 3, 4, 5 stars, se aplica multiplicador
  return Math.round(basePoints * (modifier || 1));
}

/**
 * Calcular puntos para el creador del request (sin rating del aplicante).
 * Es el bonus base: `basePoints × 1.2`.
 *
 * @param basePoints Puntos base del request
 * @returns Puntos base + 20%
 */
export function calculateCreatorPoints(basePoints: number): number {
  return Math.round(basePoints * (1 + CREATOR_BONUS_PERCENTAGE));
}

/**
 * Calcular puntos finales del creador en función del rating que le dio el
 * aplicante. Mismo principio que `calculateApplicantPoints`:
 *
 *   - 1★/2★ → penalización plana (-80 / -30), SIN bonus de creador
 *     (un rating malo no debería seguir regalando el +20%).
 *   - 3★/4★/5★ → `(basePoints × 1.2) × modificador`
 *
 * Antes esta lógica vivía inline en `ratings.service.ts` mezclando suma con
 * multiplicación y dejaba al creador con `basePoints × 1.2 - 80` cuando
 * recibía 1★, lo que en niveles altos seguía siendo un saldo positivo.
 */
export function calculateCreatorPointsWithRating(
  basePoints: number,
  stars: number,
): number {
  if (stars < 1 || stars > 5) {
    throw new Error("Stars must be between 1 and 5");
  }

  const modifier = RATING_MODIFIERS[stars];

  // 1★/2★: pérdida fija, sin bonus de creador.
  if (modifier != null && modifier < 1) {
    return modifier;
  }

  // 3★/4★/5★: bonus +20% × multiplicador del rating.
  return Math.round(
    basePoints * (1 + CREATOR_BONUS_PERCENTAGE) * (modifier ?? 1),
  );
}

/**
 * Obtener la medalla correspondiente a una cantidad de puntos
 */
export function getMedalByPoints(totalPoints: number): Medal {
  for (const medal of MEDAL_ORDER) {
    const range = MEDAL_RANGES[medal];
    if (totalPoints >= range.min && totalPoints <= range.max) {
      return medal;
    }
  }
  return "CHALLENGER"; // Fallback
}

/**
 * Obtener la próxima medalla y puntos faltantes
 */
export function getNextMedalInfo(
  currentMedal: Medal,
  currentPoints: number
): {
  nextMedal: Medal | null;
  pointsNeeded: number;
} {
  const currentIndex = MEDAL_ORDER.indexOf(currentMedal);

  if (currentIndex === MEDAL_ORDER.length - 1) {
    // Ya está en CHALLENGER
    return { nextMedal: null, pointsNeeded: 0 };
  }

  const nextMedal = MEDAL_ORDER[currentIndex + 1];
  const nextMedalRange = MEDAL_RANGES[nextMedal];
  const pointsNeeded = Math.max(0, nextMedalRange.min - currentPoints);

  return { nextMedal, pointsNeeded };
}

/**
 * Construir mensaje de razón para PointLog
 */
export function buildPointLogReason(
  eventType: "RATING_RECEIVED" | "CREATOR_BONUS",
  data: {
    requestTitle?: string;
    stars?: number;
    requestId?: string;
  }
): string {
  switch (eventType) {
    case "RATING_RECEIVED":
      return `Rating received (${data.stars}★) for "${data.requestTitle}"`;
    case "CREATOR_BONUS":
      return `Creator bonus for completing request "${data.requestTitle}"`;
    default:
      return "Points update";
  }
}
