"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  X,
} from "lucide-react";

const TAGS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Python",
  "Django",
  "Java",
  "Spring Boot",
  "SQL",
  "MongoDB",
  "AWS",
  "Linux",
  "Docker",
  "Flutter",
  "Dart",
  "Swift",
  "Kotlin",
  "Arduino",
  "IoT",
  "Git",
];

const TOTAL_STEPS = 3;

interface FormData {
  tipo: "Asesoría" | "Proyecto" | "";
  titulo: string;
  descripcion: string;
  tags: string[];
  dificultad: number;
  fechaLimite: string;
  beneficio: string;
  participantes: number;
}

const initialForm: FormData = {
  tipo: "",
  titulo: "",
  descripcion: "",
  tags: [],
  dificultad: 1,
  fechaLimite: "",
  beneficio: "",
  participantes: 1,
};

const difficultyInfo = [
  { label: "Muy fácil", points: 50 },
  { label: "Fácil", points: 100 },
  { label: "Intermedio", points: 180 },
  { label: "Difícil", points: 280 },
  { label: "Muy difícil", points: 400 },
];

export default function CreateSolicitudView() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (step === 1 && !form.tipo) newErrors.tipo = "Selecciona un tipo";
    if (step === 2) {
      if (!form.titulo.trim()) newErrors.titulo = "El título es obligatorio";
      if (form.titulo.length > 80) newErrors.titulo = "Máximo 80 caracteres";
      if (!form.descripcion.trim())
        newErrors.descripcion = "La descripción es obligatoria";
      if (form.descripcion.length > 1000)
        newErrors.descripcion = "Máximo 1000 caracteres";
      if (form.tags.length === 0) newErrors.tags = "Selecciona al menos un tag";
    }
    if (step === 3 && !form.fechaLimite)
      newErrors.fechaLimite = "La fecha límite es obligatoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    console.log(form);
    router.push("/solicitudes?tab=mis-solicitudes");
  };

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
              Crear solicitud
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
                          : "Busca socios para desarrollar un proyecto académico, personal o de emprendimiento. Puede incluir beneficio económico."}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tags requeridos
                </label>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium text-white"
                        style={{ background: "#1a4ca3" }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X size={10} strokeWidth={2.5} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.filter((t) => !form.tags.includes(t)).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[#1a4ca3] hover:text-[#1a4ca3] transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                {errors.tags && (
                  <p className="text-xs text-red-500 mt-1">{errors.tags}</p>
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
                    {difficultyInfo[form.dificultad - 1].label}
                  </p>
                  <p className="text-xs font-semibold text-[#057f78]">
                    +{difficultyInfo[form.dificultad - 1].points} pts base
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
                  Cantidad de participantes
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        participantes: Math.max(1, form.participantes - 1),
                      })
                    }
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:border-[#1a4ca3] hover:text-[#1a4ca3] transition-colors flex items-center justify-center font-medium"
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
                        participantes: form.participantes + 1,
                      })
                    }
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:border-[#1a4ca3] hover:text-[#1a4ca3] transition-colors flex items-center justify-center font-medium"
                  >
                    +
                  </button>
                </div>
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
                    type="number"
                    placeholder="0.00"
                    min={0}
                    value={form.beneficio}
                    onChange={(e) =>
                      setForm({ ...form, beneficio: e.target.value })
                    }
                    className="flex-1 px-4 py-2.5 rounded-r-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3] transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Si lo dejas vacío se mostrará como "Voluntario / Sin
                  remuneración".
                </p>
              </div>

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
                    {form.tags.join(", ")}
                  </p>
                  <p>
                    <span className="text-gray-400">Dificultad:</span>{" "}
                    {form.dificultad}/5 — +
                    {difficultyInfo[form.dificultad - 1].points} pts
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
                className="flex items-center gap-1.5 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors bg-[#057f78] hover:bg-[#046860]"
              >
                <Check size={16} strokeWidth={2} />
                Publicar solicitud
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
