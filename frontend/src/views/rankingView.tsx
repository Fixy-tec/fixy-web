"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Lock,
  Star,
  Trophy,
  Users,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMedals, type MedalInfo } from "../context/MedalsContext";
import { useUserProfile } from "../context/UserProfileContext";
import { useRanking } from "../context/RankingContext";
import { useAuth } from "../context/AuthContext";
import { mapUserDtoToProfile } from "@/src/lib/user";

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
        <Image
          src={medal.image}
          alt={medal.name}
          width={64}
          height={64}
          className="w-16 h-16 mx-auto"
        />
        <p className="text-lg font-bold mt-1" style={{ color: medal.color }}>
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

// ── View principal ───────────────────────────────────────────────────────────
const RankingView = () => {
  const { medals, getMedalByPoints, getNextMedal, calculateMedalProgress } =
    useMedals();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profileUser, isLoading: profileLoading } = useUserProfile();
  const { ranking, isLoading: rankingLoading, error, refresh } = useRanking();

  const [filterMedal, setFilterMedal] = useState<string>("todos");
  const router = useRouter();

  // ── Datos del usuario logueado (para el panel "Mi posición") ──
  const me = useMemo(
    () => (profileUser ? mapUserDtoToProfile(profileUser) : null),
    [profileUser],
  );
  const MY_POINTS = me?.points ?? 0;
  const MY_MEDAL = getMedalByPoints(MY_POINTS);
  const NEXT_MEDAL = getNextMedal(MY_MEDAL);
  const PROGRESS = calculateMedalProgress(MY_POINTS, MY_MEDAL);
  const myRank = me?.ranking ?? 0;

  // ── Lista filtrada + top 10 ──
  const filtered = useMemo(
    () =>
      filterMedal === "todos"
        ? ranking
        : ranking.filter((s) => s.medal === filterMedal),
    [ranking, filterMedal],
  );
  const top10 = filtered.slice(0, 10);

  const isInitialLoading =
    (authLoading || profileLoading || rankingLoading) && ranking.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ── Header ── */}
        <div className="relative bg-linear-to-r from-[#057f78] via-[#046d67] to-[#1a4ca3] rounded-3xl p-8 text-white shadow-lg overflow-hidden mb-8">
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#1a4ca3] opacity-20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-[#057f78] opacity-20 rounded-full blur-[80px]" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Trophy size={22} strokeWidth={2} />
              <div>
                <h1 className="text-2xl font-semibold">Ranking</h1>
                <p className="text-white/60 text-sm">
                  Tu posición en el ranking
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={rankingLoading}
              className="flex items-center gap-1.5 text-xs font-medium bg-white/15 hover:bg-white/25 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
              title="Actualizar ranking"
            >
              <RefreshCw
                size={12}
                className={rankingLoading ? "animate-spin" : ""}
              />
              Actualizar
            </button>
          </div>
        </div>

        {/* ── Estado de carga inicial ── */}
        {isInitialLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
          </div>
        )}

        {/* ── No autenticado ── */}
        {!authLoading && !isAuthenticated && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">
              Inicia sesión para ver tu posición en el ranking.
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && !isInitialLoading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Contenido principal (solo si autenticado y cargado) ── */}
        {!isInitialLoading && isAuthenticated && (
          <>
            {/* ── Mi posición actual ── */}
            <div
              className="bg-white rounded-3xl border shadow-sm overflow-hidden"
              style={{ borderColor: MY_MEDAL.border }}
            >
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
                      ? `${(NEXT_MEDAL.min - MY_POINTS).toLocaleString()} pts para ${NEXT_MEDAL.name}`
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
                      <p className="text-xl font-bold text-gray-700">
                        {myRank > 0 ? `#${myRank}` : "—"}
                      </p>
                    </div>
                    {NEXT_MEDAL && (
                      <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-center">
                        <p className="text-xs text-gray-400">Siguiente</p>
                        <div className="flex flex-col items-center">
                          <Image
                            src={NEXT_MEDAL.image}
                            alt={NEXT_MEDAL.name}
                            width={32}
                            height={32}
                            className="w-8 h-8"
                          />
                          <p
                            className="text-sm font-bold"
                            style={{ color: NEXT_MEDAL.color }}
                          >
                            {NEXT_MEDAL.name}
                          </p>
                        </div>
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
                    style={{
                      width: `${PROGRESS}%`,
                      background: MY_MEDAL.color,
                    }}
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
                {medals.map((m) => {
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
                          <Image
                            src={m.image}
                            alt={m.name}
                            width={64}
                            height={64}
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
                      borderColor:
                        filterMedal === "todos" ? "#1a4ca3" : "#e5e7eb",
                    }}
                  >
                    Todos
                  </button>
                  {medals
                    .slice()
                    .reverse()
                    .map((m) => (
                      <button
                        key={m.name}
                        onClick={() => setFilterMedal(m.name)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium"
                        style={{
                          background:
                            filterMedal === m.name ? m.color : "white",
                          color: filterMedal === m.name ? "white" : "#6b7280",
                          borderColor:
                            filterMedal === m.name ? m.color : "#e5e7eb",
                        }}
                      >
                        <Image
                          src={m.image}
                          alt={m.name}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        {m.name}
                      </button>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {rankingLoading && ranking.length > 0 && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-400 border-b border-gray-50">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Actualizando…
                  </div>
                )}

                {top10.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No hay estudiantes en esta liga aún.
                  </div>
                ) : (
                  top10.map((student, i) => {
                    const medal =
                      medals.find((m) => m.name === student.medal) ??
                      getMedalByPoints(student.points);
                    const isTop3 = i < 3;
                    const podiumEmoji = ["🥇", "🥈", "🥉"][i] ?? null;

                    return (
                      <div
                        key={student.id}
                        onClick={() => router.push(`/users/${student.id}`)}
                        className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        {/* Posición */}
                        <div className="w-8 text-center shrink-0">
                          {isTop3 ? (
                            <span className="text-xl">{podiumEmoji}</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-400">
                              #{student.rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 bg-white"
                          style={{ borderColor: medal.border }}
                        >
                          <Image
                            src={student.avatarUrl}
                            alt={student.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {student.name}
                            </p>
                            <Image
                              src={medal.image}
                              alt={medal.name}
                              width={20}
                              height={20}
                              className="w-5 h-5 shrink-0"
                            />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                            <span className="truncate">{student.carrera}</span>
                            <span className="shrink-0">
                              ⭐ {student.rating.toFixed(1)}
                            </span>
                            <span className="shrink-0">
                              {student.completadas} completadas
                            </span>
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

              {filterMedal === "Challenger" && top10.length > 0 && (
                <p className="text-xs text-center text-gray-400 mt-3">
                  Solo se muestran los top 10 Challengers de la institución.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RankingView;
