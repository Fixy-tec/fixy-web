"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useTags } from "@/src/context/TagContext";
import { useUserProfile } from "@/src/context/UserProfileContext";

const TOTAL_STEPS = 4;

type OnboardingForm = {
  tagNames: string[];
  avatarPath: string;
  whatsapp: string;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
};

const OnboardingView = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { tags, isLoading: tagsLoading, error: tagsError } = useTags();
  const {
    saveProfile,
    isSaving,
    defaultAvatarPaths,
    normalizeWhatsapp,
    toProfileImagePath,
    profileRules,
    isWhatsappValid,
    validateBio,
    validateOptionalUrl,
  } = useUserProfile();

  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingForm>({
    tagNames: [],
    avatarPath: "",
    whatsapp: "",
    bio: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const toggleTag = (name: string) => {
    setData((prev) => {
      if (prev.tagNames.includes(name)) {
        return {
          ...prev,
          tagNames: prev.tagNames.filter((t) => t !== name),
        };
      }
      if (prev.tagNames.length >= profileRules.TAGS_MAX) return prev;
      return { ...prev, tagNames: [...prev.tagNames, name] };
    });
  };

  const whatsappOk = () => isWhatsappValid(normalizeWhatsapp(data.whatsapp));

  const bioError = validateBio(data.bio);
  const githubError = validateOptionalUrl(data.githubUrl, "GitHub");
  const linkedinError = validateOptionalUrl(data.linkedinUrl, "LinkedIn");
  const portfolioError = validateOptionalUrl(data.portfolioUrl, "Portafolio");

  const canNext = () => {
    if (step === 1)
      return (
        data.tagNames.length > 0 &&
        data.tagNames.length <= profileRules.TAGS_MAX
      );
    if (step === 2) return data.avatarPath !== "";
    if (step === 3) return whatsappOk() && !bioError;
    if (step === 4) return !githubError && !linkedinError && !portfolioError;
    return true;
  };

  const handleFinish = async () => {
    setSubmitError(null);

    if (githubError || linkedinError || portfolioError) {
      setSubmitError(githubError ?? linkedinError ?? portfolioError);
      return;
    }
    if (bioError) {
      setSubmitError(bioError);
      return;
    }
    if (!whatsappOk()) {
      setSubmitError(
        "Ingresa un WhatsApp peruano válido (9 dígitos, comienza con 9)",
      );
      return;
    }

    try {
      await saveProfile({
        tags: [...new Set(data.tagNames)],
        whatsapp: normalizeWhatsapp(data.whatsapp),
        avatarUrl: toProfileImagePath(data.avatarPath),
        bio: data.bio.trim() || undefined,
        githubUrl: data.githubUrl.trim() || undefined,
        linkedinUrl: data.linkedinUrl.trim() || undefined,
        portfolioUrl: data.portfolioUrl.trim() || undefined,
      });
      router.push("/home");
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "No se pudo guardar tu perfil",
      );
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefefe]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Image
            src="/gaaa.png"
            alt="Fixy Logo"
            width={130}
            height={48}
            className="object-contain h-10 w-auto mx-auto mb-4"
            priority
          />

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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10">
          {tagsError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {tagsError}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-1">
                ¿Cuáles son tus tecnologías?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Selecciona entre 1 y {profileRules.TAGS_MAX} tags del catálogo
                de Fixy.
              </p>
              {tagsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-7 h-7 animate-spin text-[#1a4ca3]" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = data.tagNames.includes(tag.name);
                    const limitReached =
                      !selected &&
                      data.tagNames.length >= profileRules.TAGS_MAX;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        disabled={limitReached}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-[#057f78] mt-4">
                {data.tagNames.length}/{profileRules.TAGS_MAX} seleccionada
                {data.tagNames.length === 1 ? "" : "s"}
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-1">
                Elige tu avatar
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Guardamos la URL pública de la imagen en tu perfil.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {defaultAvatarPaths.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setData({ ...data, avatarPath: src })}
                    className="relative rounded-2xl overflow-hidden border-2 transition-all duration-150"
                    style={{
                      borderColor:
                        data.avatarPath === src ? "#1a4ca3" : "transparent",
                    }}
                  >
                    <Image
                      src={src}
                      alt="Avatar"
                      width={120}
                      height={120}
                      className="w-full h-auto object-cover"
                    />
                    {data.avatarPath === src && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#1a4ca3] flex items-center justify-center">
                        <Check size={11} color="white" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-1">
                  Cuéntanos sobre ti
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  El WhatsApp es obligatorio para completar tu perfil en Fixy.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-500">
                    +51
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="999999999"
                    maxLength={9}
                    value={data.whatsapp}
                    onChange={(e) =>
                      setData({
                        ...data,
                        whatsapp: e.target.value.replace(/\D/g, "").slice(0, 9),
                      })
                    }
                    className="flex-1 px-4 py-2.5 rounded-r-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3] transition-colors"
                  />
                </div>
                {!whatsappOk() && data.whatsapp.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Ingresa un número válido (9 dígitos, comienza con 9).
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Solo visible cuando alguien te apruebe en una solicitud.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descripción personal{" "}
                  <span className="text-gray-400 font-normal">
                    (opcional, {profileRules.BIO_MIN}-{profileRules.BIO_MAX}{" "}
                    caracteres si la completas)
                  </span>
                </label>
                <textarea
                  placeholder="Ej: Estudiante de DDS apasionado por el backend y las APIs..."
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                  maxLength={profileRules.BIO_MAX}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
                    bioError
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {bioError ? (
                    <p className="text-xs text-red-500">{bioError}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-gray-400">
                    {data.bio.length}/{profileRules.BIO_MAX}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-1">
                  Tus links
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  GitHub, LinkedIn y portafolio son opcionales.
                </p>
              </div>

              {[
                {
                  label: "GitHub",
                  field: "githubUrl" as const,
                  placeholder: "https://github.com/tuusuario",
                  error: githubError,
                },
                {
                  label: "LinkedIn",
                  field: "linkedinUrl" as const,
                  placeholder: "https://linkedin.com/in/tuusuario",
                  error: linkedinError,
                },
                {
                  label: "Portafolio",
                  field: "portfolioUrl" as const,
                  placeholder: "https://tuportafolio.com",
                  error: portfolioError,
                },
              ].map(({ label, field, placeholder, error }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder={placeholder}
                    value={data[field]}
                    onChange={(e) =>
                      setData({ ...data, [field]: e.target.value })
                    }
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                      error
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                    }`}
                  />
                  {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                  )}
                </div>
              ))}

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {submitError}
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-4 mt-2">
                <p className="text-xs text-[#1a4ca3] leading-relaxed">
                  ¡Ya casi terminas! Tu perfil estará listo para conectar con
                  otros estudiantes de TECSUP.
                </p>
              </div>
            </div>
          )}

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
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-[#057f78] hover:bg-[#05605c] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} strokeWidth={2} />
                )}
                {isSaving ? "Guardando…" : "Ir a Fixy"}
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
