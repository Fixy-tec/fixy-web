import { BookOpen, Rocket, Zap, DollarSign, Users, Clock } from "lucide-react";

type SolicitudType = "Asesoría" | "Proyecto";
type SolicitudStatus = "Abierta" | "En proceso" | "Completada" | "Cancelada";

export interface Solicitud {
  id: number;
  tipo: SolicitudType;
  titulo: string;
  descripcion: string;
  tags: string[];
  dificultad: number;
  fechaLimite: string;
  fechaPublicacion: string;
  postulantes: number;
  participantes: number;
  beneficio?: string;
  status: SolicitudStatus;
  autor: string;
}

const statusStyle: Record<SolicitudStatus, string> = {
  Abierta: "bg-emerald-50 text-emerald-700 border-emerald-100",
  "En proceso": "bg-amber-50 text-amber-700 border-amber-200",
  Completada: "bg-purple-50 text-purple-700 border-purple-100",
  Cancelada: "bg-rose-50 text-rose-600 border-rose-100",
};

const daysLeft = (fecha: string) =>
  Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

interface Props {
  solicitud: Solicitud;
  onClick: (s: Solicitud) => void;
}

export default function SolicitudCard({ solicitud: s, onClick }: Props) {
  const dias = daysLeft(s.fechaLimite);
  const urgente = dias <= 3 && s.status === "Abierta";
  const accentColor = s.tipo === "Asesoría" ? "#143d87" : "#057f78";

  return (
    <div
      onClick={() => onClick(s)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm flex hover:shadow-md hover:border-gray-200 transition-all cursor-pointer overflow-hidden"
    >
      {/* Barra lateral de color */}
      <div
        className="w-1 flex-shrink-0 rounded-l-2xl"
        style={{ background: accentColor }}
      />

      {/* Contenido */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Tipo + Estado */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{
              background: s.tipo === "Asesoría" ? "#eff4ff" : "#effaf8",
              color: accentColor,
            }}
          >
            {s.tipo === "Asesoría" ? (
              <BookOpen size={11} strokeWidth={2} />
            ) : (
              <Rocket size={11} strokeWidth={2} />
            )}
            {s.tipo}
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusStyle[s.status]}`}
          >
            {s.status}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-sm font-semibold text-gray-800 leading-snug">
          {s.titulo}
        </h3>

        {/* Descripción */}
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {s.descripcion}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {s.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Zap size={13} strokeWidth={2} style={{ color: accentColor }} />
            <span className="font-medium text-gray-700">
              Dificultad {s.dificultad}/5
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users size={12} strokeWidth={2} />
            <span>
              {s.participantes} cupo{s.participantes !== 1 ? "s" : ""}
            </span>
          </div>

          <div
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: s.beneficio ? "#057f78" : "#9ca3af" }}
          >
            <DollarSign size={12} strokeWidth={2} />
            {s.beneficio ?? "Voluntario"}
          </div>

          {/* Días restantes */}
          <div
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: urgente ? "#ef4444" : "#9ca3af" }}
          >
            <Clock size={12} strokeWidth={2} />
            {dias > 0 ? `${dias}d` : "Vence hoy"}
          </div>
        </div>
      </div>
    </div>
  );
}
