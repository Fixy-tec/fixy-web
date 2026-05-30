"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useTags } from "@/src/context/TagContext";
import {
  useRequest,
  DIFFICULTY_LABELS,
  basePointsForDifficulty,
  type SolicitudDetailData,
} from "@/src/context/RequestContext";

const TOTAL_STEPS = 3;

interface FormData {
  tipo: "Asesoría" | "Proyecto" | "";
  titulo: string;
  descripcion: string;
  tagIds: string[];
  dificultad: number;
  fechaLimite: string;
  beneficio: string;
  participantes: number;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;

const initialForm: FormData = {
  tipo: "",
  titulo: "",
  descripcion: "",
  tagIds: [],
  dificultad: 1,
  fechaLimite: "",
  beneficio: "",
  participantes: 1,
};

function buildFormFromDetail(detail: SolicitudDetailData): FormData {
  return {
    tipo: detail.tipo,
    titulo: detail.titulo,
    descripcion: detail.descripcionCompleta,
    tagIds: detail.tagIds,
    dificultad: detail.dificultad,
    fechaLimite: detail.fechaLimite,
    beneficio:
      detail.beneficioMonto != null && detail.beneficioMonto > 0
        ? String(detail.beneficioMonto)
        : "",
    participantes: detail.participantes,
  };
}

export interface CreateSolicitudViewProps {
  /** "create" abre el formulario en blanco; "edit" precarga `initialData`. */
  mode?: "create" | "edit";
  /** Datos previos para precargar el formulario (requerido en modo edición). */
  initialData?: SolicitudDetailData;
  /** ID de la solicitud a editar (requerido en modo edición). */
  requestId?: string;
}

export default function CreateSolicitudView({
  mode = "create",
  initialData,
  requestId,
}: CreateSolicitudViewProps = {}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isLoggingOut } = useAuth();
  const { tags: catalogTags, isLoading: tagsLoading, error: tagsError } =
    useTags();
  const {
    createSolicitud,
    isCreating,
    updateSolicitud,
    isUpdating,
    requestRules,
    validateTitle,
    validateDescription,
    validateTagIds,
    validateParticipants,
    validateEconomicBenefit,
    validateDeadline,
  } = useRequest();

  const isEdit = mode === "edit";
  const isSubmitting = isEdit ? isUpdating : isCreating;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(() =>
    isEdit && initialData ? buildFormFromDetail(initialData) : initialForm,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");

  // Si se actualiza `initialData` (carga asíncrona del detalle) repoblamos el form.
  useEffect(() => {
    if (isEdit && initialData) {
      setForm(buildFormFromDetail(initialData));
    }
  }, [isEdit, initialData]);

  const tagNameById = useMemo(() => {
    const map = new Map<string, string>();
    catalogTags.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [catalogTags]);

  useEffect(() => {
    if (authLoading) return;
    if (isLoggingOut) return; // logout en curso → AuthContext navega
    if (!isAuthenticated) {
      const from =
        isEdit && requestId
          ? `/applications/${requestId}/editar`
          : "/applications/crear";
      router.replace(`/forbidden?from=${encodeURIComponent(from)}`);
    }
  }, [authLoading, isAuthenticated, isLoggingOut, router, isEdit, requestId]);

  // Para ASESORIA el backend fuerza participantes = 1, espejamos en UI
  useEffect(() => {
    if (form.tipo === "Asesoría" && form.participantes !== 1) {
      setForm((prev) => ({ ...prev, participantes: 1 }));
    }
  }, [form.tipo, form.participantes]);

  const toggleTag = (tagId: string) => {
    setForm((prev) => {
      if (prev.tagIds.includes(tagId)) {
        return { ...prev, tagIds: prev.tagIds.filter((id) => id !== tagId) };
      }
      if (prev.tagIds.length >= requestRules.TAGS_MAX) return prev;
      return { ...prev, tagIds: [...prev.tagIds, tagId] };
    });
  };

  const collectErrors = (forStep: number | "all"): FieldErrors => {
    const newErrors: FieldErrors = {};

    if (forStep === 1 || forStep === "all") {
      if (!form.tipo) newErrors.tipo = "Selecciona un tipo";
    }

    if (forStep === 2 || forStep === "all") {
      const titleErr = validateTitle(form.titulo);
      if (titleErr) newErrors.titulo = titleErr;

      const descErr = validateDescription(form.descripcion);
      if (descErr) newErrors.descripcion = descErr;

      const tagsErr = validateTagIds(form.tagIds);
      if (tagsErr) newErrors.tagIds = tagsErr;
    }

    if (forStep === 3 || forStep === "all") {
      const deadlineErr = validateDeadline(form.fechaLimite);
      if (deadlineErr) newErrors.fechaLimite = deadlineErr;

      const partsErr = validateParticipants(form.participantes);
      if (partsErr) newErrors.participantes = partsErr;

      const benefitErr = validateEconomicBenefit(form.beneficio);
      if (benefitErr) newErrors.beneficio = benefitErr;
    }

    return newErrors;
  };

  const validateStep = (forStep = step) => {
    const newErrors = collectErrors(forStep);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Valida los 3 pasos antes de publicar. */
  const validateAll = () => {
    const newErrors = collectErrors("all");
    setErrors(newErrors);
    return { ok: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const { ok, errors: allErrors } = validateAll();
    if (!ok || !form.tipo) {
      if (allErrors.tipo) setStep(1);
      else if (allErrors.titulo || allErrors.descripcion || allErrors.tagIds)
        setStep(2);
      else setStep(3);
      return;
    }

    const tagNames = form.tagIds
      .map((id) => tagNameById.get(id))
      .filter((n): n is string => Boolean(n));

    setSubmitError("");
    try {
      const payload = {
        tipo: form.tipo,
        titulo: form.titulo,
        descripcion: form.descripcion,
        tagIds: form.tagIds,
        tagNames,
        dificultad: form.dificultad,
        fechaLimite: form.fechaLimite,
        participantes:
          form.tipo === "Asesoría" ? 1 : form.participantes,
        beneficio: form.beneficio,
      };

      if (isEdit && requestId) {
        await updateSolicitud(requestId, payload);
        router.push(`/applications/${requestId}`);
      } else {
        await createSolicitud(payload);
        router.push("/applications");
      }
    } catch (e) {
      setSubmitError(
        e instanceof Error
          ? e.message
          : isEdit
            ? "No se pudo actualizar la solicitud"
            : "No se pudo publicar la solicitud",
      );
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => (step === 1 ? router.back() : setStep((s) => s - 1))}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            {step === 1 ? "Volver" : "Atrás"}
          </button>

          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-gray-800">
              {isEdit ? "Editar solicitud" : "Crear solicitud"}
            </h1>
            <span className="text-xs text-gray-400">
              Paso {step} de {TOTAL_STEPS}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(step / TOTAL_STEPS) * 100}%`,
                background: "linear-gradient(to right, #1a4ca3, #057f78)",
              }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8">
          {/* Step 1 — Tipo */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">
                ¿Qué tipo de solicitud es?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Esto define cómo otros estudiantes verán tu publicación.
              </p>

              <div className="grid grid-cols-1 gap-4">
                {(["Asesoría", "Proyecto"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm({ ...form, tipo })}
                    className="flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor:
                        form.tipo === tipo
                          ? tipo === "Asesoría"
                            ? "#143d87"
                            : "#057f78"
                          : "#e5e7eb",
                      background:
                        form.tipo === tipo
                          ? tipo === "Asesoría"
                            ? "#eff4ff"
                            : "#effaf8"
                          : "white",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: tipo === "Asesoría" ? "#dbeafe" : "#d1fae5",
                        color: tipo === "Asesoría" ? "#143d87" : "#057f78",
                      }}
                    >
                      {tipo === "Asesoría" ? (
                        <BookOpen size={20} strokeWidth={1.8} />
                      ) : (
                        <Rocket size={20} strokeWidth={1.8} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 mb-1">{tipo}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {tipo === "Asesoría"
                          ? "Busca ayuda con un curso, revisión de trabajo, repaso antes de examen o retroalimentación de un proyecto."
                          : "Busca socios para desarrollar un proyecto académico, personal o de emprendimiento."}
                      </p>
                    </div>
                    {form.tipo === tipo && (
                      <Check
                        size={16}
                        className="ml-auto shrink-0"
                        style={{
                          color: tipo === "Asesoría" ? "#143d87" : "#057f78",
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
              {errors.tipo && (
                <p className="text-xs text-red-500 mt-3">{errors.tipo}</p>
              )}
            </div>
          )}

          {/* Step 2 — Detalles */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">
                  Cuéntanos más
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Mientras más detallado, mejores postulantes atraerás.
                </p>
              </div>

              {/* Título */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Título
                  </label>
                  <span className="text-xs text-gray-400">
                    {form.titulo.length}/80
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Ej: Necesito ayuda con consultas SQL avanzadas"
                  maxLength={80}
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.titulo
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                  }`}
                />
                {errors.titulo && (
                  <p className="text-xs text-red-500 mt-1">{errors.titulo}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <span className="text-xs text-gray-400">
                    {form.descripcion.length}/1000
                  </span>
                </div>
                <textarea
                  placeholder="Describe con detalle qué necesitas, cuándo, y qué conocimientos previos tiene quien te ayudará..."
                  maxLength={1000}
                  rows={4}
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
                    errors.descripcion
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                  }`}
                />
                {errors.descripcion && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.descripcion}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Tags requeridos
                  </label>
                  <span className="text-xs text-gray-400">
                    {form.tagIds.length}/{requestRules.TAGS_MAX}
                  </span>
                </div>
                {form.tagIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.tagIds.map((tagId) => (
                      <span
                        key={tagId}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium text-white"
                        style={{ background: "#1a4ca3" }}
                      >
                        {tagNameById.get(tagId) ?? tagId}
                        <button
                          type="button"
                          onClick={() => toggleTag(tagId)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X size={10} strokeWidth={2.5} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {tagsError && (
                  <p className="text-xs text-amber-700 mb-2">{tagsError}</p>
                )}
                {tagsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1a4ca3]" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {catalogTags
                      .filter((t) => !form.tagIds.includes(t.id))
                      .map((tag) => {
                        const limitReached =
                          form.tagIds.length >= requestRules.TAGS_MAX;
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            disabled={limitReached}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[#1a4ca3] hover:text-[#1a4ca3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-500"
                          >
                            + {tag.name}
                          </button>
                        );
                      })}
                  </div>
                )}
                {errors.tagIds && (
                  <p className="text-xs text-red-500 mt-1">{errors.tagIds}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Condiciones */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">
                  Condiciones
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Define la dificultad, el plazo y si hay compensación
                  económica.
                </p>
              </div>

              {/* Dificultad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Nivel de dificultad
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, dificultad: n })}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all"
                      style={{
                        borderColor:
                          form.dificultad === n ? "#1a4ca3" : "#e5e7eb",
                        background: form.dificultad === n ? "#eff4ff" : "white",
                      }}
                    >
                      <Zap
                        size={16}
                        strokeWidth={2}
                        style={{
                          color: form.dificultad >= n ? "#1a4ca3" : "#d1d5db",
                        }}
                        fill={form.dificultad >= n ? "#1a4ca3" : "none"}
                      />
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: form.dificultad === n ? "#1a4ca3" : "#9ca3af",
                        }}
                      >
                        {n}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {DIFFICULTY_LABELS[form.dificultad]}
                  </p>
                  <p className="text-xs font-semibold text-[#057f78]">
                    +{basePointsForDifficulty(form.dificultad)} pts base
                  </p>
                </div>
              </div>

              {/* Fecha límite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fecha límite estimada
                </label>
                <input
                  type="date"
                  value={form.fechaLimite}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setForm({ ...form, fechaLimite: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 focus:outline-none focus:ring-2 transition-colors ${
                    errors.fechaLimite
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                  }`}
                />
                {errors.fechaLimite && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.fechaLimite}
                  </p>
                )}
              </div>

              {/* Participantes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cantidad de participantes{" "}
                  <span className="text-gray-400 font-normal">
                    (máx {requestRules.PARTICIPANTS_MAX})
                  </span>
                </label>
                {form.tipo === "Asesoría" ? (
                  <p className="text-xs text-gray-500">
                    Las asesorías siempre son 1 a 1.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            participantes: Math.max(
                              requestRules.PARTICIPANTS_MIN,
                              form.participantes - 1,
                            ),
                          })
                        }
                        disabled={
                          form.participantes <= requestRules.PARTICIPANTS_MIN
                        }
                        className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:border-[#1a4ca3] hover:text-[#1a4ca3] transition-colors flex items-center justify-center font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-500"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold text-gray-700 w-4 text-center">
                        {form.participantes}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            participantes: Math.min(
                              requestRules.PARTICIPANTS_MAX,
                              form.participantes + 1,
                            ),
                          })
                        }
                        disabled={
                          form.participantes >= requestRules.PARTICIPANTS_MAX
                        }
                        className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:border-[#1a4ca3] hover:text-[#1a4ca3] transition-colors flex items-center justify-center font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-500"
                      >
                        +
                      </button>
                    </div>
                    {errors.participantes && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.participantes}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Beneficio económico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Beneficio económico{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="flex">
                  <span className="px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-500">
                    S/.
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.beneficio}
                    onKeyDown={(e) => {
                      if (["-", "+", "e", "E"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      // Solo dígitos y un punto decimal, sin signo
                      const cleaned = e.target.value
                        .replace(/[^0-9.]/g, "")
                        .replace(/(\..*?)\..*/g, "$1");
                      setForm({ ...form, beneficio: cleaned });
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-r-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                      errors.beneficio
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                    }`}
                  />
                </div>
                {errors.beneficio ? (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.beneficio}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Si lo dejas vacío se mostrará como "Voluntario / Sin
                    remuneración".
                  </p>
                )}
              </div>

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs text-red-700">{submitError}</p>
                </div>
              )}

              {/* Resumen */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-[#1a4ca3] mb-2">
                  Resumen
                </p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>
                    <span className="text-gray-400">Tipo:</span> {form.tipo}
                  </p>
                  <p>
                    <span className="text-gray-400">Título:</span> {form.titulo}
                  </p>
                  <p>
                    <span className="text-gray-400">Tags:</span>{" "}
                    {form.tagIds
                      .map((id) => tagNameById.get(id) ?? id)
                      .join(", ")}
                  </p>
                  <p>
                    <span className="text-gray-400">Dificultad:</span>{" "}
                    {form.dificultad}/5 — +
                    {basePointsForDifficulty(form.dificultad)} pts
                  </p>
                  <p>
                    <span className="text-gray-400">Fecha límite:</span>{" "}
                    {form.fechaLimite || "—"}
                  </p>
                  <p>
                    <span className="text-gray-400">Compensación:</span>{" "}
                    {form.beneficio ? `S/. ${form.beneficio}` : "Voluntario"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="flex items-center justify-between mt-8">
            <div />
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors bg-[#1a4ca3] hover:bg-[#143d87]"
              >
                Continuar
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors bg-[#057f78] hover:bg-[#046860] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} strokeWidth={2} />
                )}
                {isSubmitting
                  ? isEdit
                    ? "Guardando…"
                    : "Publicando…"
                  : isEdit
                    ? "Guardar cambios"
                    : "Publicar solicitud"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
