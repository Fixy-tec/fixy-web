"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";

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

const AVATARS = [
  "/avatars/fixoArte.png",
  "/avatars/fixoCyborg.png",
  "/avatars/fixoHacker.png",
  "/avatars/fixoKarate.png",
  "/avatars/fixoMoney.png",
  "/avatars/fixoPirata.png",
];

const TOTAL_STEPS = 4;

const OnboardingView = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    tags: [] as string[],
    avatar: "",
    whatsapp: "",
    bio: "",
    portfolio: "",
  });

  const toggleTag = (tag: string) => {
    setData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleFinish = () => {
    console.log(data);
    // redirigir al home
  };

  const canNext = () => {
    if (step === 1) return data.tags.length > 0;
    if (step === 2) return data.avatar !== "";
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/gaaa.png"
              alt="Fixy Logo"
              width={130}
              height={48}
              className="object-contain h-10 w-auto mx-auto mb-4"
              priority
            />
          </Link>

          {/* Progress bar */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i + 1 === step ? "2rem" : "1rem",
                  background: i + 1 <= step ? "#1a4ca3" : "#e5e7eb",
                }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Paso {step} de {TOTAL_STEPS}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10">
          {/* Step 1 — Tags */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-1">
                ¿Cuáles son tus tecnologías?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Selecciona al menos una. Esto nos ayuda a mostrarte solicitudes
                relevantes.
              </p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const selected = data.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150"
                      style={{
                        background: selected ? "#057f78" : "white",
                        color: selected ? "white" : "#4b5563",
                        borderColor: selected ? "#057f78" : "#e5e7eb",
                      }}
                    >
                      {selected && (
                        <Check
                          size={11}
                          className="inline mr-1"
                          strokeWidth={2.5}
                        />
                      )}
                      {tag}
                    </button>
                  );
                })}
              </div>
              {data.tags.length > 0 && (
                <p className="text-xs text-[#057f78] mt-4">
                  {data.tags.length} seleccionada
                  {data.tags.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Step 2 — Avatar */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-1">
                Elige tu avatar
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Esta será tu imagen de perfil dentro de Fixy.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {AVATARS.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setData({ ...data, avatar: src })}
                    className="relative rounded-2xl overflow-hidden border-2 transition-all duration-150"
                    style={{
                      borderColor:
                        data.avatar === src ? "#1a4ca3" : "transparent",
                    }}
                  >
                    <Image
                      src={src}
                      alt={`Avatar ${i + 1}`}
                      width={120}
                      height={120}
                      className="w-full h-auto object-cover"
                    />
                    {data.avatar === src && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#1a4ca3] flex items-center justify-center">
                        <Check size={11} color="white" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — WhatsApp + Bio */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-1">
                  Cuéntanos sobre ti
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Esta info aparecerá en tu perfil público. Puedes editarla
                  después.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  WhatsApp{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="flex">
                  <span className="px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-500">
                    +51
                  </span>
                  <input
                    type="tel"
                    placeholder="999 999 999"
                    value={data.whatsapp}
                    onChange={(e) =>
                      setData({ ...data, whatsapp: e.target.value })
                    }
                    className="flex-1 px-4 py-2.5 rounded-r-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3] transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Solo visible cuando alguien te apruebe en una solicitud.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descripción personal{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  placeholder="Ej: Estudiante de DDS apasionado por el backend y las APIs..."
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3] transition-colors resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {data.bio.length}/200
                </p>
              </div>
            </div>
          )}

          {/* Step 4 — Portafolio / redes */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-1">
                  Tus links
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Agrega tu portafolio o redes. Completamente opcional.
                </p>
              </div>

              {[
                {
                  label: "GitHub",
                  key: "github",
                  placeholder: "https://github.com/tuusuario",
                },
                {
                  label: "LinkedIn",
                  key: "linkedin",
                  placeholder: "https://linkedin.com/in/tuusuario",
                },
                {
                  label: "Portafolio",
                  key: "portfolio",
                  placeholder: "https://tuportafolio.com",
                },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder={placeholder}
                    value={
                      (data as unknown as Record<string, string>)[key] ?? ""
                    }
                    onChange={(e) =>
                      setData({ ...data, [key]: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3] transition-colors"
                  />
                </div>
              ))}

              <div className="bg-blue-50 rounded-xl p-4 mt-2">
                <p className="text-xs text-[#1a4ca3] leading-relaxed">
                  ¡Ya casi terminas! Tu perfil estará listo para conectar con
                  otros estudiantes de TECSUP.
                </p>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft size={16} strokeWidth={2} />
                Atrás
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="flex items-center gap-1.5 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canNext() ? "#1a4ca3" : "#9ca3af" }}
              >
                Continuar
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 bg-[#057f78] hover:bg-[#05605c] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                <Check size={16} strokeWidth={2} />
                Ir a Fixy
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Puedes completar o editar esta información después desde tu perfil.
        </p>
      </div>
    </div>
  );
};

export default OnboardingView;
