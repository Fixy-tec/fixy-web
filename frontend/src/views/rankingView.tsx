"use client";

import { useState } from "react";
import {
  Lock,
  Star,
  Trophy,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react";

import { useRouter } from "next/navigation";

type Medal =
  | "Hierro"
  | "Bronce"
  | "Plata"
  | "Oro"
  | "Diamante"
  | "Maestro"
  | "Challenger";

interface MedalInfo {
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

interface Student {
  id: number;
  name: string;
  points: number;
  medal: Medal;
  avatar: string;
  rating: number;
  completadas: number;
  carrera: string;
}

// ── Config de medallas ───────────────────────────────────────────────────────
const MEDALS: MedalInfo[] = [
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

// ── Usuario actual (hardcoded) ───────────────────────────────────────────────
const MY_POINTS = 2000;
const MY_MEDAL = MEDALS.find(
  (m) => MY_POINTS >= m.min && (m.max === null || MY_POINTS <= m.max),
)!;
const NEXT_MEDAL = MEDALS[MEDALS.indexOf(MY_MEDAL) + 1] ?? null;
const PROGRESS = NEXT_MEDAL
  ? ((MY_POINTS - MY_MEDAL.min) / (NEXT_MEDAL.min - MY_MEDAL.min)) * 100
  : 100;

// ── Ranking hardcoded ────────────────────────────────────────────────────────
const STUDENTS: Student[] = [
  {
    id: 1,
    name: "Valeria Ríos",
    points: 9800,
    medal: "Maestro",
    avatar: "VR",
    rating: 4.9,
    completadas: 42,
    carrera: "DDS",
  },
  {
    id: 2,
    name: "Diego Paredes",
    points: 8200,
    medal: "Maestro",
    avatar: "DP",
    rating: 4.8,
    completadas: 38,
    carrera: "DDS",
  },
  {
    id: 3,
    name: "Lucía Fuentes",
    points: 6100,
    medal: "Maestro",
    avatar: "LF",
    rating: 4.7,
    completadas: 29,
    carrera: "Redes",
  },
  {
    id: 4,
    name: "Carlos Mendoza",
    points: 5500,
    medal: "Diamante",
    avatar: "CM",
    rating: 4.9,
    completadas: 24,
    carrera: "DDS",
  },
  {
    id: 5,
    name: "Sofía Castillo",
    points: 4200,
    medal: "Diamante",
    avatar: "SC",
    rating: 4.6,
    completadas: 19,
    carrera: "DDS",
  },
  {
    id: 6,
    name: "Andrés Pinto",
    points: 3600,
    medal: "Diamante",
    avatar: "AP",
    rating: 4.5,
    completadas: 16,
    carrera: "Electrónica",
  },
  {
    id: 7,
    name: "Fernanda Lagos",
    points: 2900,
    medal: "Oro",
    avatar: "FL",
    rating: 4.4,
    completadas: 13,
    carrera: "DDS",
  },
  {
    id: 8,
    name: "Miguel Torres",
    points: 2100,
    medal: "Oro",
    avatar: "MT",
    rating: 4.3,
    completadas: 10,
    carrera: "Redes",
  },
  {
    id: 9,
    name: "Camila Vega",
    points: 1400,
    medal: "Plata",
    avatar: "CV",
    rating: 4.2,
    completadas: 7,
    carrera: "DDS",
  },
  {
    id: 10,
    name: "Roberto Huanca",
    points: 900,
    medal: "Plata",
    avatar: "RH",
    rating: 4.0,
    completadas: 5,
    carrera: "Electrónica",
  },
];

// ── Componente de gráfico circular ───────────────────────────────────────────
function CircularProgress({
  progress,
  medal,
}: {
  progress: number;
  medal: MedalInfo;
}) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={medal.color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="z-10 text-center">
        <img src={medal.image} alt={medal.name} className="w-16 h-16 mx-auto" />
        <p className="text-lg font-bold mt-1" style={{ color: medal.color }}>
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

// ── View principal ───────────────────────────────────────────────────────────
const RankingView = () => {
  const [filterMedal, setFilterMedal] = useState<Medal | "todos">("todos");
  const router = useRouter();
  const filtered =
    filterMedal === "todos"
      ? STUDENTS
      : STUDENTS.filter((s) => s.medal === filterMedal);

  const top10 = filtered.slice(0, 10);
  const myRank = STUDENTS.findIndex((s) => s.id === 10) + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ── Header ── */}
        <div className="relative bg-linear-to-r from-[#057f78] via-[#046d67] to-[#1a4ca3] rounded-3xl p-8 text-white shadow-lg overflow-hidden mb-8">
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#1a4ca3] opacity-20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-[#057f78] opacity-20 rounded-full blur-[80px]" />
          <div className="relative flex items-center gap-3">
            <Trophy size={22} strokeWidth={2} />
            <div>
              <h1 className="text-2xl font-semibold">Ranking</h1>
              <p className="text-white/60 text-sm">Tu posición en el ranking</p>
            </div>
          </div>
        </div>

        {/* ── Mi posición actual ── */}
        <div
          className="bg-white rounded-3xl border shadow-sm overflow-hidden"
          style={{ borderColor: MY_MEDAL.border }}
        >
          {/* Tira de color */}
          <div
            className="h-1.5 w-full"
            style={{ background: MY_MEDAL.color }}
          />

          <div className="p-6 flex flex-col md:flex-row gap-6 items-center">
            {/* Gráfico */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <CircularProgress progress={PROGRESS} medal={MY_MEDAL} />
              <span className="text-xs text-gray-400">
                {NEXT_MEDAL
                  ? `${NEXT_MEDAL.min - MY_POINTS} pts para ${NEXT_MEDAL.name}`
                  : "¡Rango máximo!"}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
                Tu rango actual
              </p>
              <h2
                className="text-4xl font-bold mb-1"
                style={{ color: MY_MEDAL.color }}
              >
                {MY_MEDAL.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {MY_MEDAL.description}
              </p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xs text-gray-400">Tus puntos</p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: MY_MEDAL.color }}
                  >
                    {MY_POINTS.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xs text-gray-400">Tu posición</p>
                  <p className="text-xl font-bold text-gray-700">#{myRank}</p>
                </div>
                {NEXT_MEDAL && (
                  <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-center">
                    <p className="text-xs text-gray-400">Siguiente</p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: NEXT_MEDAL.color }}
                    >
                      <img
                        src={NEXT_MEDAL.image}
                        alt={NEXT_MEDAL.name}
                        className="w-8 h-8 mx-auto"
                      />
                      {NEXT_MEDAL.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra de progreso lineal */}
          <div className="px-6 pb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{MY_MEDAL.min.toLocaleString()} pts</span>
              <span>
                {NEXT_MEDAL ? `${NEXT_MEDAL.min.toLocaleString()} pts` : "∞"}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${PROGRESS}%`, background: MY_MEDAL.color }}
              />
            </div>
          </div>
        </div>

        {/* ── Medallas ── */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Star size={16} color="#1a4ca3" strokeWidth={2} />
            Todas las medallas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {MEDALS.map((m) => {
              const unlocked = MY_POINTS >= m.min;
              const isCurrent = m.name === MY_MEDAL.name;
              return (
                <div
                  key={m.name}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all relative"
                  style={{
                    background: unlocked ? m.bg : "#f9fafb",
                    borderColor: isCurrent
                      ? m.color
                      : unlocked
                        ? m.border
                        : "#e5e7eb",
                    boxShadow: isCurrent ? `0 0 16px ${m.glow}` : "none",
                    opacity: unlocked ? 1 : 0.5,
                  }}
                >
                  {isCurrent && (
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                      style={{ background: m.color }}
                    >
                      Tú aquí
                    </span>
                  )}
                  <span className="text-2xl">
                    {unlocked ? (
                      <img
                        src={m.image}
                        alt={m.name}
                        className="w-16 h-16 mx-auto"
                      />
                    ) : (
                      <Lock size={18} color="#9ca3af" />
                    )}
                  </span>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: unlocked ? m.color : "#9ca3af" }}
                  >
                    {m.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {m.min.toLocaleString()}
                    {m.max ? `–${m.max.toLocaleString()}` : "+"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Ranking de estudiantes ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <Users size={16} color="#1a4ca3" strokeWidth={2} />
              Top estudiantes
            </h2>
            {/* Filtro por medalla */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterMedal("todos")}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all font-medium"
                style={{
                  background: filterMedal === "todos" ? "#1a4ca3" : "white",
                  color: filterMedal === "todos" ? "white" : "#6b7280",
                  borderColor: filterMedal === "todos" ? "#1a4ca3" : "#e5e7eb",
                }}
              >
                Todos
              </button>
              {MEDALS.slice()
                .reverse()
                .map((m) => (
                  <button
                    key={m.name}
                    onClick={() => setFilterMedal(m.name)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-all font-medium"
                    style={{
                      background: filterMedal === m.name ? m.color : "white",
                      color: filterMedal === m.name ? "white" : "#6b7280",
                      borderColor: filterMedal === m.name ? m.color : "#e5e7eb",
                    }}
                  >
                    <img
                      src={m.image}
                      alt={m.name}
                      className="w-6 h-6 mx-auto"
                    />
                    {m.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {top10.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No hay estudiantes en esta liga aún.
              </div>
            ) : (
              top10.map((student, i) => {
                const medal = MEDALS.find((m) => m.name === student.medal)!;
                const isTop3 = i < 3;
                const podiumEmoji = ["🥇", "🥈", "🥉"][i] ?? null;

                return (
                  <div
                    key={student.id}
                    onClick={() => router.push(`/users/${student.id}`)}
                    className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Posición */}
                    <div className="w-8 text-center shrink-0">
                      {isTop3 ? (
                        <span className="text-xl">{podiumEmoji}</span>
                      ) : (
                        <span className="text-sm font-bold text-gray-400">
                          #{i + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: medal.color }}
                    >
                      {student.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {student.name}
                        </p>
                        <img
                          src={medal.image}
                          alt={medal.name}
                          className="w-6 h-6 mx-auto"
                        />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span>{student.carrera}</span>
                        <span>⭐ {student.rating}</span>
                        <span>{student.completadas} completadas</span>
                      </div>
                    </div>

                    {/* Puntos */}
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-bold"
                        style={{ color: medal.color }}
                      >
                        {student.points.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-gray-400">pts</p>
                    </div>

                    <ChevronRight
                      size={14}
                      strokeWidth={2}
                      className="text-gray-300 shrink-0"
                    />
                  </div>
                );
              })
            )}
          </div>

          {filterMedal === "Challenger" && (
            <p className="text-xs text-center text-gray-400 mt-3">
              Solo se muestran los top 10 Challengers de la institución.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingView;
