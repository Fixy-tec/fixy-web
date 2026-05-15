"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  Rocket,
  Zap,
  Users,
  DollarSign,
  Calendar,
  ChevronLeft,
  Clock,
  Tag,
  Send,
} from "lucide-react";
import { Solicitud } from "@/src/components/cards/solicitudCard";

// Hardcoded — reemplazar con fetch real por ID
const SOLICITUD_MOCK: Solicitud & {
  descripcionCompleta: string;
  autorAvatar: string;
  autorMedalla: string;
  autorRating: number;
} = {
  id: 1,
  tipo: "Asesoría",
  titulo: "Necesito ayuda con consultas SQL avanzadas",
  descripcion:
    "Tengo un parcial la próxima semana y no entiendo JOINs ni subconsultas.",
  descripcionCompleta:
    "Tengo un parcial la próxima semana sobre bases de datos relacionales y no entiendo bien cómo funcionan los JOINs (INNER, LEFT, RIGHT) ni las subconsultas correlacionadas. Estoy usando PostgreSQL. Busco a alguien que me pueda explicar con ejemplos prácticos y que tenga paciencia para responder mis dudas. Idealmente haríamos una sesión de 1 a 2 horas por videollamada.",
  tags: ["SQL", "PostgreSQL"],
  dificultad: 2,
  fechaLimite: "2025-05-20",
  fechaPublicacion: "2025-05-10",
  postulantes: 3,
  participantes: 1,
  status: "Abierta",
  autor: "Carlos Mendoza",
  autorAvatar: "",
  autorMedalla: "Plata",
  autorRating: 4.7,
};

const statusStyle: Record<string, string> = {
  Abierta: "bg-emerald-50 text-emerald-700 border-emerald-100",
  "En proceso": "bg-amber-50 text-amber-700 border-amber-200",
  Completada: "bg-blue-50 text-blue-700 border-blue-100",
  Cancelada: "bg-rose-50 text-rose-600 border-rose-100",
};

const difficultyLabel = [
  "",
  "Muy fácil",
  "Fácil",
  "Intermedio",
  "Difícil",
  "Muy difícil",
];
const difficultyPoints = [0, 50, 100, 180, 280, 400];

const durationDays = (inicio: string, fin: string) =>
  Math.ceil(
    (new Date(fin).getTime() - new Date(inicio).getTime()) /
      (1000 * 60 * 60 * 24),
  );

export default function SolicitudDetailView() {
  const router = useRouter();
  const s = SOLICITUD_MOCK;
  const dias = durationDays(s.fechaPublicacion, s.fechaLimite);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Volver
        </button>

        {/* Card principal */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          {/* Tipo + Estado */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={
                s.tipo === "Asesoría"
                  ? { background: "#eff4ff", color: "#143d87" }
                  : { background: "#effaf8", color: "#057f78" }
              }
            >
              {s.tipo === "Asesoría" ? (
                <BookOpen size={12} strokeWidth={2} />
              ) : (
                <Rocket size={12} strokeWidth={2} />
              )}
              {s.tipo}
            </span>
            <span
              className={`text-xs px-3 py-1.5 rounded-full border font-medium ${statusStyle[s.status]}`}
            >
              {s.status}
            </span>
          </div>

          {/* Título */}
          <h1 className="text-xl font-semibold text-gray-800 mb-4">
            {s.titulo}
          </h1>

          {/* Descripción completa */}
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            {s.descripcionCompleta}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {s.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500"
              >
                <Tag size={10} strokeWidth={2} />
                {tag}
              </span>
            ))}
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Zap
                size={16}
                className="mx-auto mb-1"
                style={{ color: "#1a4ca3" }}
                strokeWidth={2}
              />
              <p className="text-xs text-gray-400 mb-0.5">Dificultad</p>
              <p className="text-sm font-semibold text-gray-700">
                {difficultyLabel[s.dificultad]}
              </p>
              <p className="text-xs text-[#057f78] font-medium">
                +{difficultyPoints[s.dificultad]} pts
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Users
                size={16}
                className="mx-auto mb-1 text-gray-400"
                strokeWidth={2}
              />
              <p className="text-xs text-gray-400 mb-0.5">Cupos</p>
              <p className="text-sm font-semibold text-gray-700">
                {s.participantes} persona{s.participantes > 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Clock
                size={16}
                className="mx-auto mb-1"
                style={{ color: dias <= 3 ? "#ef4444" : "#9ca3af" }}
                strokeWidth={2}
              />
              <p className="text-xs text-gray-400 mb-0.5">Tiempo</p>
              <p
                className="text-sm font-semibold"
                style={{ color: dias <= 3 ? "#ef4444" : "#374151" }}
              >
                {dias > 0 ? `${dias} días` : "Hoy"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <DollarSign
                size={16}
                className="mx-auto mb-1"
                style={{ color: "#057f78" }}
                strokeWidth={2}
              />
              <p className="text-xs text-gray-400 mb-0.5">Compensación</p>
              <p
                className="text-sm font-semibold"
                style={{ color: s.beneficio ? "#057f78" : "#9ca3af" }}
              >
                {s.beneficio ?? "Voluntario"}
              </p>
            </div>
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-50 pt-4">
            <span className="flex items-center gap-1">
              <Calendar size={12} strokeWidth={2} />
              Publicado:{" "}
              {new Date(s.fechaPublicacion).toLocaleDateString("es-PE")}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} strokeWidth={2} />
              Límite: {new Date(s.fechaLimite).toLocaleDateString("es-PE")}
            </span>
          </div>
        </div>

        {/* Autor */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Publicado por
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
              style={{ background: "#1a4ca3" }}
            >
              {s.autor.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{s.autor}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span>⭐ {s.autorRating}</span>
                <span>·</span>
                <span className="font-medium" style={{ color: "#057f78" }}>
                  {s.autorMedalla}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Postulantes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2">
            <Users size={14} style={{ color: "#1a4ca3" }} strokeWidth={2} />
            <p className="text-sm font-semibold text-gray-700">
              {s.postulantes} postulante{s.postulantes !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* CTA Postular */}
        {s.status === "Abierta" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              ¿Puedes ayudar?
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Escribe un mensaje de presentación (máx. 300 caracteres)
              explicando por qué eres el indicado.
            </p>
            <textarea
              placeholder="Ej: Tengo experiencia en SQL y PostgreSQL, he ayudado a varios compañeros con JOINs. Podemos hacer una sesión esta semana..."
              maxLength={300}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#057f78]/30 focus:border-[#057f78] transition-colors resize-none mb-3"
            />
            <button className="w-full flex items-center justify-center gap-2 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors bg-[#057f78] hover:bg-[#046860]">
              <Send size={15} strokeWidth={2} />
              Postularme
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
