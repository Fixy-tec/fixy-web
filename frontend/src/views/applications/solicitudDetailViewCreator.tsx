"use client";

import { useState } from "react";
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
  Check,
  X,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { useRequest } from "@/src/context/RequestContext";
import type { SolicitudDetailData } from "@/src/lib/solicitudMappers";

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

interface Props {
  solicitud: SolicitudDetailData;
}

export default function SolicitudDetailViewCreator({ solicitud: s }: Props) {
  const router = useRouter();
  const { deleteSolicitud, isDeleting, deleteError } = useRequest();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const dias = durationDays(s.fechaPublicacion, s.fechaLimite);

  const handleEdit = () => {
    router.push(`/applications/${s.id}/editar`);
  };

  const handleConfirmDelete = async () => {
    setLocalError(null);
    try {
      await deleteSolicitud(s.id);
      router.push("/applications");
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "No se pudo eliminar la solicitud",
      );
    }
  };

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

          {/* Descripción */}
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
              />
              <p className="text-xs text-gray-400 mb-0.5">Dificultad</p>
              <p className="text-sm font-semibold text-gray-700">
                {difficultyLabel[s.dificultad]}
              </p>
              <p className="text-xs text-[#057f78] font-medium">
                +{s.basePoints} pts
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Users size={16} className="mx-auto mb-1 text-[#1a4ca3]" />
              <p className="text-xs text-gray-400 mb-0.5">Postulantes</p>
              <p className="text-sm font-semibold text-gray-700">
                {s.postulantes}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Clock size={16} className="mx-auto mb-1 text-gray-400" />
              <p className="text-xs text-gray-400 mb-0.5">Duración</p>
              <p className="text-sm font-semibold text-gray-700">{dias} días</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <DollarSign size={16} className="mx-auto mb-1 text-[#057f78]" />
              <p className="text-xs text-gray-400 mb-0.5">Compensación</p>
              <p className="text-sm font-semibold text-[#057f78]">
                {s.beneficio ?? "Voluntario"}
              </p>
            </div>
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-50 pt-4">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Publicado:{" "}
              {new Date(s.fechaPublicacion).toLocaleDateString("es-PE")}
            </span>

            <span className="flex items-center gap-1">
              <Clock size={12} />
              Finaliza: {new Date(s.fechaLimite).toLocaleDateString("es-PE")}
            </span>
          </div>
        </div>

        {/* Lista postulantes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} style={{ color: "#1a4ca3" }} />
            <h2 className="text-sm font-semibold text-gray-700">Postulantes</h2>
          </div>

          <div className="space-y-4">
            {s.postulantesDetalle.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                Aún no hay postulantes.
              </p>
            ) : (
              s.postulantesDetalle.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {p.nombre}
                </p>

                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  {p.mensaje}
                </p>

                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 bg-[#057f78] hover:bg-[#046860] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                    <Check size={13} />
                    Aceptar
                  </button>

                  <button className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                    <X size={13} />
                    Rechazar
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleEdit}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil size={15} />
              Editar solicitud
            </button>

            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                setConfirmOpen(true);
              }}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={15} />
              Retirar solicitud
            </button>
          </div>

          {(localError || deleteError) && !confirmOpen && (
            <p className="mt-3 text-xs text-red-600">
              {localError ?? deleteError}
            </p>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  Eliminar solicitud
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  ¿Seguro que quieres retirar{" "}
                  <span className="font-medium text-gray-700">{s.titulo}</span>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {localError && (
              <p className="text-xs text-red-600 mb-3">{localError}</p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {isDeleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
