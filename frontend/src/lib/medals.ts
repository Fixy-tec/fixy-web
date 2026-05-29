export type Medal =
  | "Hierro"
  | "Bronce"
  | "Plata"
  | "Oro"
  | "Diamante"
  | "Maestro"
  | "Challenger";

export interface MedalInfo {
  name: Medal;
  min: number;
  max: number | null;
  description: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  image: string;
}

export interface Student {
  id: number;
  name: string;
  points: number;
  medal: Medal;
  avatar: string;
  rating: number;
  completadas: number;
  carrera: string;
}

export const MEDALS: MedalInfo[] = [
  {
    name: "Hierro",
    min: 0,
    max: 299,
    description: "Usuario nuevo, sin historial.",
    color: "#8B7355",
    bg: "#f5f0ea",
    border: "#c4a882",
    glow: "rgba(139,115,85,0.3)",
    image: "/medals/hierro.png",
  },
  {
    name: "Bronce",
    min: 300,
    max: 799,
    description: "Ha completado sus primeras solicitudes.",
    color: "#CD7F32",
    bg: "#fdf3e7",
    border: "#e8a85a",
    glow: "rgba(205,127,50,0.3)",
    image: "/medals/bronze.png",
  },
  {
    name: "Plata",
    min: 800,
    max: 1799,
    description: "Usuario activo con buena reputación.",
    color: "#6B7280",
    bg: "#f3f4f6",
    border: "#9ca3af",
    glow: "rgba(107,114,128,0.3)",
    image: "/medals/plata.png",
  },
  {
    name: "Oro",
    min: 1800,
    max: 3499,
    description: "Destacado, muy confiable. Top 30%.",
    color: "#D97706",
    bg: "#fffbeb",
    border: "#fbbf24",
    glow: "rgba(217,119,6,0.35)",
    image: "/medals/oro.png",
  },
  {
    name: "Diamante",
    min: 3500,
    max: 5999,
    description: "Élite. Referente en su área. Top 10%.",
    color: "#1a4ca3",
    bg: "#eff4ff",
    border: "#3b82f6",
    glow: "rgba(26,76,163,0.35)",
    image: "/medals/diamante.png",
  },
  {
    name: "Maestro",
    min: 6000,
    max: 9999,
    description: "Experto reconocido. Top 5%.",
    color: "#7C3AED",
    bg: "#f5f3ff",
    border: "#8b5cf6",
    glow: "rgba(124,58,237,0.35)",
    image: "/medals/maestro.png",
  },
  {
    name: "Challenger",
    min: 10000,
    max: null,
    description: "Los mejores de la institución.",
    color: "#057f78",
    bg: "#effaf8",
    border: "#10b981",
    glow: "rgba(5,127,120,0.4)",
    image: "/medals/challenger.png",
  },
];

/**
 * Obtiene la medalla correspondiente a una cantidad de puntos
 */
export const getMedalByPoints = (points: number): MedalInfo => {
  return (
    MEDALS.find(
      (m) => points >= m.min && (m.max === null || points <= m.max),
    ) || MEDALS[0]
  );
};

/**
 * Obtiene la siguiente medalla
 */
export const getNextMedal = (currentMedal: MedalInfo): MedalInfo | null => {
  const currentIndex = MEDALS.indexOf(currentMedal);
  return currentIndex < MEDALS.length - 1 ? MEDALS[currentIndex + 1] : null;
};

/**
 * Calcula el progreso en porcentaje hacia la siguiente medalla
 */
export const calculateMedalProgress = (
  points: number,
  currentMedal: MedalInfo,
): number => {
  const nextMedal = getNextMedal(currentMedal);
  if (!nextMedal) return 100;
  return (
    ((points - currentMedal.min) / (nextMedal.min - currentMedal.min)) * 100
  );
};
