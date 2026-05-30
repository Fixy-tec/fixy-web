"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Globe,
  Phone,
  Pencil,
  Check,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { useMedals, Medal } from "../context/MedalsContext";
import { useUserProfile } from "../context/UserProfileContext";
import { useTags } from "../context/TagContext";
import { mapUserDtoToProfile } from "@/src/lib/user";

export interface UserProfile {
  id: string;
  name: string;
  carrera: string;
  avatar: string;
  points: number;
  medal: Medal;
  ranking: number;
  rating: number;
  completadas: number;
  bio?: string;
  whatsapp?: string;
  tags?: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

interface Props {
  user: UserProfile;
  isOwner: boolean;
  onProfileUpdated?: (user: UserProfile) => void;
}

interface DraftState {
  name: string;
  bio: string;
  whatsapp: string;
  github: string;
  linkedin: string;
  portfolio: string;
  tags: string[];
}

function buildDraft(user: UserProfile): DraftState {
  return {
    name: user.name ?? "",
    bio: user.bio ?? "",
    whatsapp: user.whatsapp ?? "",
    github: user.github ?? "",
    linkedin: user.linkedin ?? "",
    portfolio: user.portfolio ?? "",
    tags: user.tags ?? [],
  };
}

export default function UserProfileView({
  user,
  isOwner,
  onProfileUpdated,
}: Props) {
  const { medals, getMedalByPoints, getNextMedal, calculateMedalProgress } =
    useMedals();
  const {
    saveProfile,
    isSaving,
    normalizeWhatsapp,
    profileRules,
    isWhatsappValid,
    validateName,
    validateBio,
    validateOptionalUrl,
  } = useUserProfile();
  const { tags: catalogTags, isLoading: tagsLoading } = useTags();

  const medal =
    medals.find((m) => m.name === user.medal) ?? getMedalByPoints(user.points);
  const nextMedal = getNextMedal(medal);
  const progress = calculateMedalProgress(user.points, medal);

  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(buildDraft(user));

  useEffect(() => {
    if (!editing) {
      setDraft(buildDraft(user));
      setSaveError(null);
    }
  }, [user, editing]);

  // Validaciones en vivo (para feedback visual y para deshabilitar el botón)
  const nameError = validateName(draft.name);
  const bioError = validateBio(draft.bio);
  const githubError = validateOptionalUrl(draft.github, "GitHub");
  const linkedinError = validateOptionalUrl(draft.linkedin, "LinkedIn");
  const portfolioError = validateOptionalUrl(draft.portfolio, "Portafolio");
  const normalizedWp = normalizeWhatsapp(draft.whatsapp);
  const whatsappError = !isWhatsappValid(normalizedWp)
    ? "Ingresa un WhatsApp peruano válido (9 dígitos, comienza con 9)"
    : null;
  const tagsError =
    draft.tags.length > profileRules.TAGS_MAX
      ? `Máximo ${profileRules.TAGS_MAX} tags`
      : null;

  const hasErrors = Boolean(
    nameError ||
      bioError ||
      whatsappError ||
      githubError ||
      linkedinError ||
      portfolioError ||
      tagsError,
  );

  const toggleTag = (name: string) => {
    setDraft((prev) => {
      if (prev.tags.includes(name)) {
        return { ...prev, tags: prev.tags.filter((t) => t !== name) };
      }
      if (prev.tags.length >= profileRules.TAGS_MAX) return prev;
      return { ...prev, tags: [...prev.tags, name] };
    });
  };

  const handleCancel = () => {
    setDraft(buildDraft(user));
    setSaveError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!isOwner) return;
    setSaveError(null);

    if (hasErrors) {
      setSaveError(
        nameError ??
          whatsappError ??
          bioError ??
          githubError ??
          linkedinError ??
          portfolioError ??
          tagsError ??
          "Revisa los campos marcados",
      );
      return;
    }

    try {
      const normalizedName = draft.name.trim();
      const updated = await saveProfile({
        // Solo enviamos `name` si cambió, para evitar choques de duplicado innecesarios
        ...(normalizedName !== user.name ? { name: normalizedName } : {}),
        whatsapp: normalizedWp,
        bio: draft.bio.trim() || undefined,
        githubUrl: draft.github.trim() || undefined,
        linkedinUrl: draft.linkedin.trim() || undefined,
        portfolioUrl: draft.portfolio.trim() || undefined,
        tags: [...new Set(draft.tags)],
      });
      onProfileUpdated?.(mapUserDtoToProfile(updated));
      setEditing(false);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "No se pudo guardar los cambios",
      );
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
        : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* ── Card principal ── */}
        <div
          className="bg-white rounded-3xl border shadow-sm overflow-hidden"
          style={{ borderColor: medal.border }}
        >
          <div className="h-1.5 w-full" style={{ background: medal.color }} />

          <div className="p-8 flex flex-col lg:flex-row gap-8 items-center lg:items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-52 h-52 rounded-3xl overflow-hidden border-2 ring-4 ring-white bg-white"
                style={{
                  borderColor: medal.border,
                  boxShadow: `0 0 16px ${medal.glow}`,
                }}
              >
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16">
                <Image
                  src={medal.image}
                  alt={medal.name}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Info principal */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                {editing ? (
                  <div className="w-full max-w-xs">
                    <input
                      type="text"
                      value={draft.name}
                      maxLength={profileRules.NAME_MAX}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      placeholder="nombredeusuario"
                      className={inputClass(Boolean(nameError))}
                    />
                    {nameError && (
                      <p className="text-xs text-red-500 mt-1 text-left">
                        {nameError}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1 text-left">
                      {profileRules.NAME_MIN}-{profileRules.NAME_MAX} letras
                      (sin espacios ni números)
                    </p>
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-gray-800">
                    {user.name}
                  </h1>
                )}
                {isOwner && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Editar perfil"
                  >
                    <Pencil size={14} color="#9ca3af" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">{user.carrera}</p>

              {/* Stats */}
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <div className="bg-gray-50 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-400">Puntos</p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: medal.color }}
                  >
                    {user.points.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-400">Ranking</p>
                  <p className="text-lg font-bold text-gray-700">
                    {user.ranking > 0 ? `#${user.ranking}` : "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-400">Rating</p>
                  <p className="text-lg font-bold text-yellow-500">
                    ⭐ {user.rating.toFixed(1)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-400">Completadas</p>
                  <p className="text-lg font-bold text-gray-700">
                    {user.completadas}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="px-6 pb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>
                {medal.name} · {medal.min.toLocaleString()} pts
              </span>
              <span>
                {nextMedal
                  ? `${nextMedal.name} · ${nextMedal.min.toLocaleString()} pts`
                  : "Rango máximo"}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: medal.color }}
              />
            </div>
            {nextMedal && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                {(nextMedal.min - user.points).toLocaleString()} pts para{" "}
                {nextMedal.name}
              </p>
            )}
          </div>
        </div>

        {/* ── Bio ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Sobre mí
          </h2>
          {editing ? (
            <div>
              <textarea
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                maxLength={profileRules.BIO_MAX}
                rows={3}
                placeholder="Cuéntanos algo sobre ti..."
                className={`${inputClass(Boolean(bioError))} resize-none`}
              />
              <div className="flex justify-between mt-1">
                {bioError ? (
                  <p className="text-xs text-red-500">{bioError}</p>
                ) : (
                  <span className="text-xs text-gray-400">
                    Opcional ({profileRules.BIO_MIN}-{profileRules.BIO_MAX}{" "}
                    caracteres si la completas)
                  </span>
                )}
                <p className="text-xs text-gray-400">
                  {draft.bio.length}/{profileRules.BIO_MAX}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">
              {user.bio || (
                <span className="text-gray-400 italic">
                  {isOwner
                    ? "Agrega una descripción desde el botón editar."
                    : "Sin descripción."}
                </span>
              )}
            </p>
          )}
        </div>

        {/* ── Tags ── */}
        {(editing || (user.tags && user.tags.length > 0)) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Tecnologías
              </h2>
              {editing && (
                <span className="text-xs text-gray-400">
                  {draft.tags.length}/{profileRules.TAGS_MAX}
                </span>
              )}
            </div>

            {editing ? (
              <>
                {tagsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1a4ca3]" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {catalogTags.map((tag) => {
                      const selected = draft.tags.includes(tag.name);
                      const limitReached =
                        !selected &&
                        draft.tags.length >= profileRules.TAGS_MAX;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.name)}
                          disabled={limitReached}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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
                {tagsError && (
                  <p className="text-xs text-red-500 mt-2">{tagsError}</p>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{
                      background: medal.bg,
                      color: medal.color,
                      border: `1px solid ${medal.border}`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WhatsApp ── */}
        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Contacto
            </h2>
            {editing ? (
              <div>
                <div className="flex">
                  <span className="px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-500">
                    +51
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="999999999"
                    maxLength={9}
                    value={draft.whatsapp}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        whatsapp: e.target.value.replace(/\D/g, "").slice(0, 9),
                      })
                    }
                    className={`flex-1 px-4 py-2.5 rounded-r-lg border text-sm text-gray-800 focus:outline-none focus:ring-2 transition-colors ${
                      whatsappError && draft.whatsapp.length > 0
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                    }`}
                  />
                </div>
                {whatsappError && draft.whatsapp.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">{whatsappError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={15} color="#9ca3af" />
                <span>
                  {user.whatsapp ? (
                    `+51 ${user.whatsapp}`
                  ) : (
                    <span className="text-gray-400 italic">No agregado</span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Links ── */}
        {editing ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Redes y plataformas
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: "GitHub",
                  field: "github" as const,
                  placeholder: "https://github.com/tuusuario",
                  error: githubError,
                },
                {
                  label: "LinkedIn",
                  field: "linkedin" as const,
                  placeholder: "https://linkedin.com/in/tuusuario",
                  error: linkedinError,
                },
                {
                  label: "Portafolio",
                  field: "portfolio" as const,
                  placeholder: "https://tuportafolio.com",
                  error: portfolioError,
                },
              ].map(({ label, field, placeholder, error }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {label}{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder={placeholder}
                    value={draft[field]}
                    onChange={(e) =>
                      setDraft({ ...draft, [field]: e.target.value })
                    }
                    className={inputClass(Boolean(error))}
                  />
                  {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          (user.github || user.linkedin || user.portfolio) && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Redes y plataformas del usuario
                </h2>
              </div>

              <div className="grid gap-4">
                {user.github && (
                  <a
                    href={user.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-linear-to-br from-gray-50 to-white p-5 hover:border-[#1a4ca3]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shrink-0">
                        <FaGithub size={28} color="white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-base">
                              GitHub
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {user.github.replace("https://github.com/", "@")}
                            </p>
                          </div>
                          <ExternalLink
                            size={16}
                            className="text-gray-300 group-hover:text-[#1a4ca3] transition-colors"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-medium text-gray-600">
                            Open Source
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-medium text-gray-600">
                            Repositorios
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-medium text-gray-600">
                            Contribuciones
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                )}

                {user.linkedin && (
                  <a
                    href={user.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-linear-to-br from-[#f4f9ff] to-white p-5 hover:border-[#0077b5]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: "#0077b5" }}
                      >
                        <FaLinkedin size={28} color="white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-base">
                              LinkedIn
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              Perfil profesional
                            </p>
                          </div>
                          <ExternalLink
                            size={16}
                            className="text-gray-300 group-hover:text-[#0077b5] transition-colors"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-xs font-medium text-blue-700">
                            Experiencia
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-xs font-medium text-blue-700">
                            Skills
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-xs font-medium text-blue-700">
                            Networking
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                )}

                {user.portfolio && (
                  <a
                    href={user.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-linear-to-br from-[#effaf8] to-white p-5 hover:border-[#057f78]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: "#057f78" }}
                      >
                        <Globe size={26} color="white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-base">
                              Portfolio
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {user.portfolio.replace(/^https?:\/\//, "")}
                            </p>
                          </div>
                          <ExternalLink
                            size={16}
                            className="text-gray-300 group-hover:text-[#057f78] transition-colors"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-xs font-medium text-emerald-700">
                            Proyectos
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-xs font-medium text-emerald-700">
                            UI/UX
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-xs font-medium text-emerald-700">
                            Showcase
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )
        )}

        {/* ── Barra de acciones (solo en modo edición) ── */}
        {isOwner && editing && (
          <div className="sticky bottom-4 bg-white rounded-2xl border border-gray-100 shadow-lg p-4 flex flex-col gap-3">
            {saveError && (
              <p className="text-sm text-red-600 text-center">{saveError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
              >
                <X size={14} /> Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || hasErrors}
                className="flex items-center gap-1.5 bg-[#1a4ca3] hover:bg-[#143d87] text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
