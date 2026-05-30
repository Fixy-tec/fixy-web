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
  Send,
  Check,
  X as XIcon,
  Loader2,
  Star,
} from "lucide-react";

import { useAuth } from "@/src/context/AuthContext";
import { useRequest } from "@/src/context/RequestContext";
import CountdownTimer from "@/src/components/countdownTimer";
import RatingModal from "@/src/components/modals/ratingModal";
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

const MESSAGE_MAX = 300;

interface Props {
  solicitud: SolicitudDetailData;
}

export default function SolicitudDetailView({ solicitud: s }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    postular,
    isApplying,
    applyError,
    retirarPostulacion,
    isUpdatingApplication,
    applicationActionError,
    calificarCreador,
    isRating,
    ratingError,
  } = useRequest();

  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  /** Mi postulación a este request (si existe) */
  const myApplication = useMemo(
    () => s.postulantesDetalle.find((p) => p.applicantId === user?.id),
    [s.postulantesDetalle, user?.id],
  );

  const canApply = s.status === "Abierta" && !myApplication;
  const isAccepted = myApplication?.status === "ACEPTADA";
  const isRejected = myApplication?.status === "RECHAZADA";
  const isInProgress = s.statusRaw === "EN_PROCESO";
  const isCompleted = s.status === "Completada";
  const needsToRate =
    isCompleted &&
    isAccepted &&
    myApplication != null &&
    !myApplication.ratedByCurrentUser;

  /** Auto-popup: cuando se completa el request, abrimos el modal de
   *  calificación al creador (sólo una vez por sesión de la vista). */
  const autoOpenedRatingRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRatingRef.current) return;
    if (!needsToRate) return;
    setRateModalOpen(true);
    autoOpenedRatingRef.current = true;
  }, [needsToRate]);

  const handlePostular = async () => {
    setLocalError(null);
    if (message.trim().length === 0) {
      setLocalError("Escribe un mensaje para postular");
      return;
    }
    try {
      await postular(s.id, message);
      setMessage("");
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "No se pudo postular",
      );
    }
  };

  const handleRetirar = async () => {
    if (!myApplication) return;
    setLocalError(null);
    try {
      await retirarPostulacion(myApplication.applicationId);
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "No se pudo retirar la postulación",
      );
    }
  };

  const handleSubmitRating = async (stars: number, comment?: string) => {
    if (!myApplication) return;
    await calificarCreador(myApplication.applicationId, stars, comment);
    setRateModalOpen(false);
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
                +{s.basePoints} pts
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
              <Users
                size={16}
                className="mx-auto mb-1 text-gray-400"
                strokeWidth={2}
              />
              <p className="text-xs text-gray-400 mb-0.5">Postulantes</p>
              <p className="text-sm font-semibold text-gray-700">
                {s.postulantes}
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

          {/* Cronómetro: sólo activo cuando el trabajo arrancó (EN_PROCESO) */}
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
                  El plazo terminó. {isAccepted && "Califica al creador para cerrar el ciclo."}
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
                  El cronómetro se activará cuando el creador acepte a los
                  postulantes que necesita.
                </p>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-50 pt-4 flex-wrap">
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
          <button
            type="button"
            onClick={() => router.push(`/users/${s.creatorIdRaw}`)}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
              style={{ background: "#1a4ca3" }}
            >
              {s.autor.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{s.autor}</p>
              {(s.autorRating != null || s.autorMedalla) && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  {s.autorRating != null && <span>⭐ {s.autorRating}</span>}
                  {s.autorRating != null && s.autorMedalla && <span>·</span>}
                  {s.autorMedalla && (
                    <span className="font-medium" style={{ color: "#057f78" }}>
                      {s.autorMedalla}
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
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

        {/* Banner de mi postulación (si existe) */}
        {myApplication && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Mi postulación
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {myApplication.mensaje}
                </p>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full border font-medium shrink-0 ${
                  isAccepted
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : isRejected
                      ? "bg-rose-50 text-rose-600 border-rose-100"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {myApplication.statusLabel}
              </span>
            </div>

            {/* Sólo dejamos retirar si sigue PENDIENTE y el request aún acepta */}
            {myApplication.status === "PENDIENTE" && s.status === "Abierta" && (
              <button
                type="button"
                onClick={handleRetirar}
                disabled={isUpdatingApplication}
                className="w-full flex items-center justify-center gap-2 text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingApplication ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XIcon size={14} />
                )}
                Retirar postulación
              </button>
            )}

            {/* Rating cuando el request está completado y mi postulación fue aceptada */}
            {isAccepted &&
              isCompleted &&
              (myApplication?.ratedByCurrentUser ? (
                <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-center font-medium">
                  ✓ Ya calificaste al creador. ¡Gracias!
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setRateModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-white bg-[#057f78] hover:bg-[#046860] font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2"
                >
                  <Star size={14} />
                  Calificar al creador
                </button>
              ))}

            {(localError || applicationActionError) && (
              <p className="mt-3 text-xs text-red-600">
                {localError ?? applicationActionError}
              </p>
            )}
          </div>
        )}

        {/* CTA Postular */}
        {canApply && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              ¿Puedes ayudar?
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Escribe un mensaje de presentación (máx. {MESSAGE_MAX} caracteres)
              explicando por qué eres el indicado.
            </p>
            <textarea
              placeholder="Ej: Tengo experiencia en SQL y PostgreSQL, he ayudado a varios compañeros con JOINs. Podemos hacer una sesión esta semana..."
              maxLength={MESSAGE_MAX}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isApplying}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#057f78]/30 focus:border-[#057f78] transition-colors resize-none mb-2 disabled:opacity-50"
            />
            <p className="text-[11px] text-gray-400 text-right mb-3">
              {message.length}/{MESSAGE_MAX}
            </p>
            <button
              type="button"
              onClick={handlePostular}
              disabled={isApplying || message.trim().length === 0}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors bg-[#057f78] hover:bg-[#046860] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} strokeWidth={2} />
              )}
              {isApplying ? "Enviando…" : "Postularme"}
            </button>
            {(localError || applyError) && (
              <p className="mt-3 text-xs text-red-600">
                {localError ?? applyError}
              </p>
            )}
          </div>
        )}

        {/* Mensajes de estado cuando no se puede postular */}
        {!myApplication && s.status === "En proceso" && (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-center">
            <p className="text-sm text-amber-800">
              Esta solicitud ya completó su cupo de postulantes aceptados.
            </p>
          </div>
        )}

        {!myApplication &&
          (s.status === "Completada" || s.status === "Cancelada") && (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-sm text-gray-600">
                Esta solicitud ya está {s.status.toLowerCase()} y no acepta
                nuevas postulaciones.
              </p>
            </div>
          )}
      </div>

      {/* Modal de calificación al creador */}
      <RatingModal
        open={rateModalOpen}
        title="Califica al creador"
        subtitle="¿Cómo fue colaborar con"
        targetName={s.autor + "?"}
        onClose={() => setRateModalOpen(false)}
        onSubmit={handleSubmitRating}
        isSubmitting={isRating}
        externalError={ratingError}
      />
    </div>
  );
}
