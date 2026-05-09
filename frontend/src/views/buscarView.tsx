"use client";

import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  Rocket,
  DollarSign,
  Zap,
} from "lucide-react";
import SolicitudCard, { Solicitud } from "@/src/components/cards/solicitudCard";
import { useRouter } from "next/navigation";

// ── Hardcoded data ───────────────────────────────────────────────────────────
const SOLICITUDES: Solicitud[] = [
  {
    id: 1,
    tipo: "Asesoría",
    titulo: "Necesito ayuda con consultas SQL avanzadas",
    descripcion:
      "Tengo un parcial la próxima semana y no entiendo JOINs ni subconsultas. Busco alguien que me explique con ejemplos prácticos.",
    tags: ["SQL", "PostgreSQL"],
    dificultad: 2,
    fechaLimite: "2025-05-20",
    fechaPublicacion: "2025-05-10",
    postulantes: 3,
    participantes: 1,
    status: "Abierta",
    autor: "Carlos M.",
  },
  {
    id: 2,
    tipo: "Proyecto",
    titulo: "Busco socio para app de delivery con Flutter",
    descripcion:
      "Tengo el diseño listo en Figma. Busco a alguien que sepa Flutter y Dart para desarrollar el frontend móvil juntos.",
    tags: ["Flutter", "Dart"],
    dificultad: 4,
    fechaLimite: "2025-06-01",
    fechaPublicacion: "2025-05-08",
    postulantes: 5,
    participantes: 2,
    beneficio: "S/. 200",
    status: "Abierta",
    autor: "Valeria R.",
  },
  {
    id: 3,
    tipo: "Asesoría",
    titulo: "Revisión de proyecto Django REST Framework",
    descripcion:
      "Necesitan revisar una API con JWT. Me postulé con mi experiencia en Django.",
    tags: ["Python", "Django"],
    dificultad: 3,
    fechaLimite: "2025-05-18",
    fechaPublicacion: "2025-05-07",
    postulantes: 1,
    participantes: 1,
    status: "Abierta",
    autor: "Andrés P.",
  },
  {
    id: 4,
    tipo: "Proyecto",
    titulo: "Sistema IoT para monitoreo de temperatura",
    descripcion:
      "Proyecto con Arduino y sensores. Busco compañero con experiencia en IoT y algo de backend para guardar los datos.",
    tags: ["Arduino", "IoT", "Python"],
    dificultad: 3,
    fechaLimite: "2025-05-25",
    fechaPublicacion: "2025-05-06",
    postulantes: 2,
    participantes: 1,
    status: "Abierta",
    autor: "Lucía F.",
  },
  {
    id: 5,
    tipo: "Asesoría",
    titulo: "Ayuda con algoritmos de ordenamiento en Java",
    descripcion:
      "No entiendo bien QuickSort y MergeSort. Necesito que alguien me lo explique paso a paso con código.",
    tags: ["Java"],
    dificultad: 2,
    fechaLimite: "2025-05-16",
    fechaPublicacion: "2025-05-05",
    postulantes: 4,
    participantes: 1,
    status: "Abierta",
    autor: "Miguel T.",
  },
  {
    id: 6,
    tipo: "Proyecto",
    titulo: "App móvil de gestión de tareas con Kotlin",
    descripcion:
      "Emprendimiento personal. Busco socio con experiencia en Kotlin y arquitectura MVVM.",
    tags: ["Kotlin", "Android"],
    dificultad: 5,
    fechaLimite: "2025-06-15",
    fechaPublicacion: "2025-05-04",
    postulantes: 0,
    participantes: 2,
    beneficio: "S/. 500",
    status: "Abierta",
    autor: "Sofía C.",
  },
  {
    id: 7,
    tipo: "Asesoría",
    titulo: "Explicación de punteros en C++",
    descripcion:
      "Me cuesta entender la gestión de memoria y punteros. Busco una sesión de 1 hora.",
    tags: ["C++", "Linux"],
    dificultad: 4,
    fechaLimite: "2025-05-22",
    fechaPublicacion: "2025-05-03",
    postulantes: 2,
    participantes: 1,
    status: "Abierta",
    autor: "Diego R.",
  },
  {
    id: 8,
    tipo: "Proyecto",
    titulo: "Dashboard web con React y datos en tiempo real",
    descripcion:
      "Necesito socio para construir un dashboard con gráficos usando React y WebSockets.",
    tags: ["React", "JavaScript", "MongoDB"],
    dificultad: 4,
    fechaLimite: "2025-06-10",
    fechaPublicacion: "2025-05-02",
    postulantes: 3,
    participantes: 1,
    beneficio: "S/. 300",
    status: "Abierta",
    autor: "Fernanda L.",
  },
];

const ALL_TAGS = [...new Set(SOLICITUDES.flatMap((s) => s.tags))].sort();

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
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<TipoFilter>("todos");
  const [pago, setPago] = useState<PagoFilter>("todos");
  const [dificultad, setDificultad] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
    return SOLICITUDES.filter((s) => {
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
  }, [query, tipo, pago, dificultad, selectedTags]);

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
                {ALL_TAGS.map((tag) => {
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

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {results.map((s) => (
              <SolicitudCard
                key={s.id}
                solicitud={s}
                onClick={(sol) => router.push(`/applications/${sol.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Search size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-gray-500">
              No se encontraron solicitudes
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Intenta con otros filtros o términos de búsqueda
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-[#1a4ca3] hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuscarView;
