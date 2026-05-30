"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  CalendarPlus,
  Star,
} from "lucide-react";

import { useRequest } from "@/src/context/RequestContext";
import CountdownTimer from "@/src/components/countdownTimer";
import RatingModal from "@/src/components/modals/ratingModal";
import type {
  PostulanteDetalle,
  SolicitudDetailData,
} from "@/src/lib/solicitudMappers";

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

interface Props {
  solicitud: SolicitudDetailData;
}

export default function SolicitudDetailViewCreator({ solicitud: s }: Props) {
  const router = useRouter();
  const {
    deleteSolicitud,
    isDeleting,
    deleteError,
    extenderDeadline,
    isExtending,
    extendError,
    aceptarPostulante,
    rechazarPostulante,
    isUpdatingApplication,
    applicationActionError,
    calificarPostulante,
    isRating,
    ratingError,
  } = useRequest();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [rateTarget, setRateTarget] = useState<PostulanteDetalle | null>(null);

  /** Postulantes aceptados (para mostrar arriba y calcular cupos) */
  const acceptedApps = useMemo(
    () => s.postulantesDetalle.filter((p) => p.status === "ACEPTADA"),
    [s.postulantesDetalle],
  );
  const cuposRestantes = Math.max(0, s.participantes - acceptedApps.length);

  const canManagePostulants =
    s.statusRaw === "ABIERTA" || s.statusRaw === "EN_REVISION";
  const canExtend =
    s.statusRaw !== "CANCELADA" &&
    s.statusRaw !== "COMPLETADA" &&
    !s.isExpired;
  /**
   * Editar solo tiene sentido cuando el trabajo aún NO arrancó. Una vez que
   * el request pasa a EN_PROCESO (cupo lleno), COMPLETADA o CANCELADA, los
   * postulantes aceptados ya están comprometidos con las reglas originales y
   * cambiarlas a mitad de juego rompe expectativas.
   */
  const canEdit =
    s.statusRaw === "ABIERTA" || s.statusRaw === "EN_REVISION";
  const isCompleted = s.status === "Completada";
  /** El cronómetro sólo tiene sentido cuando el trabajo arrancó */
  const isInProgress = s.statusRaw === "EN_PROCESO";

  const editDisabledReason = canEdit
    ? undefined
    : isInProgress
      ? "No puedes editar una solicitud que ya está en proceso"
      : isCompleted
        ? "No puedes editar una solicitud completada"
        : "No puedes editar una solicitud cancelada";

  /** Postulantes aceptados a los que aún no he calificado */
  const pendingRatings = useMemo(
    () => acceptedApps.filter((p) => !p.ratedByCurrentUser),
    [acceptedApps],
  );

  /**
   * Auto-popup: cuando el request se completa y todavía me quedan postulantes
   * por calificar, abrimos el modal del primero. Usamos un ref para no
   * reabrirlo tras cerrarlo manualmente — el usuario tiene además el botón
   * "Calificar" en cada postulante.
   */
  const autoOpenedRatingRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRatingRef.current) return;
    if (!isCompleted) return;
    if (pendingRatings.length === 0) return;
    setRateTarget(pendingRatings[0]);
    autoOpenedRatingRef.current = true;
  }, [isCompleted, pendingRatings]);

  const handleEdit = () => {
    if (!canEdit) return;
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

  const handleExtend = async () => {
    setLocalError(null);
    if (!newDeadline) {
      setLocalError("Selecciona una nueva fecha");
      return;
    }
    try {
      await extenderDeadline(s.id, newDeadline);
      setExtendOpen(false);
      setNewDeadline("");
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "No se pudo aplazar",
      );
    }
  };

  const handleAceptar = async (applicationId: string) => {
    try {
      await aceptarPostulante(applicationId);
    } catch {
      /* el error vive en applicationActionError */
    }
  };

  const handleRechazar = async (applicationId: string) => {
    try {
      await rechazarPostulante(applicationId);
    } catch {
      /* el error vive en applicationActionError */
    }
  };

  const handleSubmitRating = async (stars: number, comment?: string) => {
    if (!rateTarget) return;
    await calificarPostulante(rateTarget.applicationId, stars, comment);
    setRateTarget(null);
  };

  const todayIso = new Date().toISOString().split("T")[0];
  // El mínimo para "aplazar" es como mínimo un día después del deadline actual
  const currentDeadlineDate = s.deadlineIso ? s.deadlineIso.split("T")[0] : todayIso;

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
              <Check size={16} className="mx-auto mb-1 text-[#057f78]" />
              <p className="text-xs text-gray-400 mb-0.5">Aceptados</p>
              <p className="text-sm font-semibold text-gray-700">
                {acceptedApps.length} / {s.participantes}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <DollarSign size={16} className="mx-auto mb-1 text-[#057f78]" />
              <p className="text-xs text-gray-400 mb-0.5">Compensación</p>
              <p className="text-sm font-semibold text-[#057f78]">
                {s.beneficio ?? "Voluntario"}
              </p>
            </div>
          </div>

          {/* Cronómetro: sólo activo cuando el cupo ya se llenó y el trabajo arrancó */}
          <div className="mb-6">
            {isInProgress ? (
              <CountdownTimer
                deadline={s.deadlineIso}
                startedAt={s.createdAtIso}
                showElapsed
              />
            ) : isCompleted ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-700">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1">
                  Solicitud completada
                </p>
                <p className="text-sm">
                  El plazo terminó. Califica a los participantes para cerrar el
                  ciclo y otorgar puntos.
                </p>
              </div>
            ) : s.statusRaw === "CANCELADA" ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-700">
                <p className="text-sm">
                  Esta solicitud fue cancelada (vencida sin completar el cupo).
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-gray-600">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-500">
                  Cronómetro en pausa
                </p>
                <p className="text-sm">
                  El cronómetro se activará cuando aceptes a{" "}
                  <span className="font-medium text-gray-700">
                    {s.participantes} postulante
                    {s.participantes !== 1 ? "s" : ""}
                  </span>{" "}
                  y la solicitud pase a estado "En proceso".
                </p>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-50 pt-4 flex-wrap">
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
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: "#1a4ca3" }} />
              <h2 className="text-sm font-semibold text-gray-700">
                Postulantes ({s.postulantes})
              </h2>
            </div>
            {canManagePostulants && cuposRestantes > 0 && (
              <span className="text-xs text-gray-500">
                Te quedan{" "}
                <span className="font-semibold text-[#057f78]">
                  {cuposRestantes}
                </span>{" "}
                cupo{cuposRestantes !== 1 ? "s" : ""} por aceptar
              </span>
            )}
          </div>

          {applicationActionError && (
            <p className="text-xs text-red-600 mb-3">
              {applicationActionError}
            </p>
          )}

          <div className="space-y-3">
            {s.postulantesDetalle.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                Aún no hay postulantes.
              </p>
            ) : (
              s.postulantesDetalle.map((p) => (
                <div
                  key={p.applicationId}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <button
                    type="button"
                    onClick={() =>
                      p.applicantId && router.push(`/users/${p.applicantId}`)
                    }
                    disabled={!p.applicantId}
                    className="flex items-start gap-3 mb-3 text-left hover:opacity-80 transition-opacity w-full disabled:cursor-default"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 bg-cover bg-center"
                      style={{
                        background: p.avatarUrl
                          ? `url(${p.avatarUrl}) center/cover`
                          : "#1a4ca3",
                      }}
                    >
                      {!p.avatarUrl && p.nombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold text-gray-800">
                          {p.nombre}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            p.status === "ACEPTADA"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : p.status === "RECHAZADA"
                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {p.statusLabel}
                        </span>
                      </div>
                      {(p.medalla || p.rating != null) && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          {p.rating != null && p.rating > 0 && (
                            <span>⭐ {p.rating}</span>
                          )}
                          {p.medalla && (
                            <span
                              className="font-medium"
                              style={{ color: "#057f78" }}
                            >
                              {p.medalla}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    {p.mensaje}
                  </p>

                  {/* Acciones según estado */}
                  {p.status === "PENDIENTE" && canManagePostulants && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAceptar(p.applicationId)}
                        disabled={isUpdatingApplication || cuposRestantes <= 0}
                        title={
                          cuposRestantes <= 0
                            ? "Ya alcanzaste el cupo máximo"
                            : undefined
                        }
                        className="flex items-center gap-1.5 bg-[#057f78] hover:bg-[#046860] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingApplication ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        Aceptar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRechazar(p.applicationId)}
                        disabled={isUpdatingApplication}
                        className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={13} />
                        Rechazar
                      </button>
                    </div>
                  )}

                  {/* Calificar (solo cuando el request ya está completado y la app fue aceptada) */}
                  {p.status === "ACEPTADA" &&
                    isCompleted &&
                    (p.ratedByCurrentUser ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 text-xs font-semibold px-3 py-2 rounded-lg">
                        <Check size={13} />
                        Calificado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRateTarget(p)}
                        className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                      >
                        <Star size={13} />
                        Calificar
                      </button>
                    ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {canExtend && (
            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                setNewDeadline("");
                setExtendOpen(true);
              }}
              disabled={isDeleting || isExtending}
              className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-3 rounded-xl text-sm transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarPlus size={15} />
              Aplazar fecha límite
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleEdit}
              disabled={isDeleting || !canEdit}
              title={editDisabledReason}
              className="flex items-center justify-center gap-2 bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1a4ca3]"
            >
              <Pencil size={15} />
              Editar solicitud
            </button>

            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                setConfirmDeleteOpen(true);
              }}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={15} />
              Retirar solicitud
            </button>
          </div>

          {!canEdit && editDisabledReason && (
            <p className="mt-3 text-xs text-gray-400 text-center">
              {editDisabledReason}.
            </p>
          )}

          {(localError || deleteError || extendError) &&
            !confirmDeleteOpen &&
            !extendOpen && (
              <p className="mt-3 text-xs text-red-600">
                {localError ?? deleteError ?? extendError}
              </p>
            )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmDeleteOpen && (
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
                onClick={() => setConfirmDeleteOpen(false)}
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

      {/* Modal de aplazar deadline */}
      {extendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <CalendarPlus size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  Aplazar fecha límite
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  La nueva fecha debe ser posterior al deadline actual (
                  {new Date(s.fechaLimite).toLocaleDateString("es-PE")}).
                </p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nueva fecha límite
            </label>
            <input
              type="date"
              value={newDeadline}
              min={currentDeadlineDate}
              onChange={(e) => setNewDeadline(e.target.value)}
              disabled={isExtending}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-colors mb-3 disabled:opacity-50"
            />

            {(localError || extendError) && (
              <p className="text-xs text-red-600 mb-3">
                {localError ?? extendError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setExtendOpen(false)}
                disabled={isExtending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExtend}
                disabled={isExtending || !newDeadline}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CalendarPlus size={14} />
                )}
                {isExtending ? "Aplazando…" : "Aplazar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de calificación a postulante */}
      <RatingModal
        open={rateTarget != null}
        title="Califica al postulante"
        subtitle="¿Cómo fue colaborar con"
        targetName={rateTarget ? `${rateTarget.nombre}?` : undefined}
        onClose={() => setRateTarget(null)}
        onSubmit={handleSubmitRating}
        isSubmitting={isRating}
        externalError={ratingError}
      />
    </div>
  );
}
