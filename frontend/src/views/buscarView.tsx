"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  Rocket,
  DollarSign,
  Zap,
  Loader2,
} from "lucide-react";
import SolicitudCard from "@/src/components/cards/solicitudCard";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useRequest } from "@/src/context/RequestContext";
import { useTags } from "@/src/context/TagContext";

type TipoFilter = "todos" | "Asesoría" | "Proyecto";
type PagoFilter = "todos" | "con-pago" | "voluntario";

const difficultyColors = [
  "",
  "#22c55e",
  "#84cc16",
  "#f59e0b",
  "#f97316",
  "#ef4444",
];

const BuscarView = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isLoggingOut } = useAuth();
  const {
    exploreRequests,
    isLoadingExplore,
    exploreError,
    refreshExplore,
  } = useRequest();
  const { tags: catalogTags } = useTags();

  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<TipoFilter>("todos");
  const [pago, setPago] = useState<PagoFilter>("todos");
  const [dificultad, setDificultad] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  useEffect(() => {
    if (authLoading) return;
    if (isLoggingOut) return; // logout en curso → AuthContext navega
    if (!isAuthenticated) {
      router.replace("/forbidden?from=/find");
      return;
    }
    void refreshExplore();
  }, [authLoading, isAuthenticated, isLoggingOut, refreshExplore, router]);

  const allTags = useMemo(
    () => [...catalogTags.map((t) => t.name)].sort((a, b) => a.localeCompare(b)),
    [catalogTags],
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setTipo("todos");
    setPago("todos");
    setDificultad(null);
    setSelectedTags([]);
    setQuery("");
  };

  const activeFiltersCount = [
    tipo !== "todos",
    pago !== "todos",
    dificultad !== null,
    selectedTags.length > 0,
  ].filter(Boolean).length;

  const results = useMemo(() => {
    return exploreRequests.filter((s) => {
      const matchQuery =
        !query ||
        s.titulo.toLowerCase().includes(query.toLowerCase()) ||
        s.descripcion.toLowerCase().includes(query.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      const matchTipo = tipo === "todos" || s.tipo === tipo;
      const matchPago =
        pago === "todos" ||
        (pago === "con-pago" && !!s.beneficio) ||
        (pago === "voluntario" && !s.beneficio);
      const matchDificultad =
        dificultad === null || s.dificultad === dificultad;
      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.every((t) => s.tags.includes(t));
      return (
        matchQuery && matchTipo && matchPago && matchDificultad && matchTags
      );
    });
  }, [exploreRequests, query, tipo, pago, dificultad, selectedTags]);

  // Paginación
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, endIndex);

  // Reset a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [query, tipo, pago, dificultad, selectedTags]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header con gradiente */}
        <div className="relative bg-linear-to-r from-[#057f78] via-[#046d67] to-[#1a4ca3] rounded-3xl p-8 text-white shadow-lg overflow-hidden mb-8">
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#1a4ca3] opacity-20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-[#057f78] opacity-20 rounded-full blur-[80px]" />

          <div className="relative">
            <h1 className="text-2xl font-semibold mb-1">Buscar solicitudes</h1>
            <p className="text-white/60 text-sm mb-6">
              Encuentra asesorías y proyectos que coincidan con tu perfil
            </p>

            {/* Search bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  placeholder="Buscar por título, descripción o tag..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black/25 hover:bg-black/40 border border-white/10 backdrop-blur-sm text-white text-sm font-medium transition-colors relative"
              >
                <SlidersHorizontal size={15} strokeWidth={2} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[#1a4ca3] text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {exploreError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {exploreError}
          </div>
        )}

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-700">Filtros</h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <X size={12} strokeWidth={2} />
                  Limpiar todo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tipo */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Tipo
                </p>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { value: "todos", label: "Todos" },
                      {
                        value: "Asesoría",
                        label: "Asesoría",
                        icon: <BookOpen size={13} strokeWidth={2} />,
                      },
                      {
                        value: "Proyecto",
                        label: "Proyecto",
                        icon: <Rocket size={13} strokeWidth={2} />,
                      },
                    ] as {
                      value: TipoFilter;
                      label: string;
                      icon?: React.ReactNode;
                    }[]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTipo(opt.value)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left"
                      style={{
                        background:
                          tipo === opt.value ? "#eff4ff" : "transparent",
                        color: tipo === opt.value ? "#1a4ca3" : "#6b7280",
                        fontWeight: tipo === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compensación */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Compensación
                </p>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { value: "todos", label: "Todos" },
                      {
                        value: "con-pago",
                        label: "Con pago",
                        icon: <DollarSign size={13} strokeWidth={2} />,
                      },
                      { value: "voluntario", label: "Voluntario" },
                    ] as {
                      value: PagoFilter;
                      label: string;
                      icon?: React.ReactNode;
                    }[]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPago(opt.value)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left"
                      style={{
                        background:
                          pago === opt.value ? "#effaf8" : "transparent",
                        color: pago === opt.value ? "#057f78" : "#6b7280",
                        fontWeight: pago === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dificultad */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Dificultad
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setDificultad(null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left"
                    style={{
                      background:
                        dificultad === null ? "#eff4ff" : "transparent",
                      color: dificultad === null ? "#1a4ca3" : "#6b7280",
                      fontWeight: dificultad === null ? 600 : 400,
                    }}
                  >
                    Todas
                  </button>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setDificultad(dificultad === n ? null : n)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left"
                      style={{
                        background:
                          dificultad === n ? "#eff4ff" : "transparent",
                        color: dificultad === n ? "#1a4ca3" : "#6b7280",
                        fontWeight: dificultad === n ? 600 : 400,
                      }}
                    >
                      <Zap
                        size={13}
                        strokeWidth={2}
                        style={{ color: difficultyColors[n] }}
                        fill={difficultyColors[n]}
                      />
                      Nivel {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-6 pt-5 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-all font-medium"
                      style={{
                        background: active ? "#1a4ca3" : "white",
                        color: active ? "white" : "#6b7280",
                        borderColor: active ? "#1a4ca3" : "#e5e7eb",
                      }}
                    >
                      {active && (
                        <X size={9} className="inline mr-1" strokeWidth={2.5} />
                      )}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">
              {results.length}
            </span>{" "}
            solicitud{results.length !== 1 ? "es" : ""} encontrada
            {results.length !== 1 ? "s" : ""}
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <X size={12} strokeWidth={2} />
              Limpiar filtros
            </button>
          )}
        </div>

        {isLoadingExplore ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {paginatedResults.map((s) => (
                <SolicitudCard
                  key={s.id}
                  solicitud={s}
                  onClick={(sol) => router.push(`/applications/${sol.id}`)}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background:
                            currentPage === page ? "#1a4ca3" : "#f3f4f6",
                          color: currentPage === page ? "white" : "#6b7280",
                        }}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Search size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-gray-500">
              No se encontraron solicitudes
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {exploreRequests.length === 0
                ? "Aún no hay solicitudes abiertas de otros usuarios"
                : "Intenta con otros filtros o términos de búsqueda"}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-[#1a4ca3] hover:underline font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuscarView;
