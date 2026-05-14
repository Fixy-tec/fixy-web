"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Star,
  Trophy,
  Globe,
  Phone,
  Pencil,
  Check,
  X,
  Lock,
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { useMedals, Medal } from "../context/MedalsContext";

export interface UserProfile {
  id: number;
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
}

export default function UserProfileView({ user, isOwner }: Props) {
  const { medals, getMedalByPoints, getNextMedal, calculateMedalProgress } =
    useMedals();
  const medal = medals.find((m) => m.name === user.medal)!;
  const nextMedal = getNextMedal(medal);
  const progress = calculateMedalProgress(user.points, medal);

  // Estado edición (solo si isOwner)
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    bio: user.bio ?? "",
    whatsapp: user.whatsapp ?? "",
  });

  const handleSave = () => {
    // Aquí iría tu llamada a la API para guardar
    console.log("Guardar:", draft);
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* ── Card principal ── */}
        <div
          className="bg-white rounded-3xl border shadow-sm overflow-hidden"
          style={{ borderColor: medal.border }}
        >
          {/* Tira de color */}
          <div className="h-1.5 w-full" style={{ background: medal.color }} />

          <div className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-44 h-44 rounded-2xl overflow-hidden border-2"
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
              {/* Medalla sobre avatar */}
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
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.name}
                </h1>
                {isOwner && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={14} color="#9ca3af" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">{user.carrera}</p>

              {/* Stats row */}
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
                    #{user.ranking}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-400">Rating</p>
                  <p className="text-lg font-bold text-yellow-500">
                    ⭐ {user.rating}
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
            <div className="space-y-3">
              <textarea
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                maxLength={200}
                rows={3}
                placeholder="Cuéntanos algo sobre ti..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3] transition-colors resize-none"
              />
              <p className="text-xs text-gray-400 text-right">
                {draft.bio.length}/200
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 bg-[#1a4ca3] text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  <Check size={14} /> Guardar
                </button>
                <button
                  onClick={() => {
                    setDraft({
                      bio: user.bio ?? "",
                      whatsapp: user.whatsapp ?? "",
                    });
                    setEditing(false);
                  }}
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg"
                >
                  <X size={14} /> Cancelar
                </button>
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
        {user.tags && user.tags.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Tecnologías
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.tags.map((tag) => (
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
          </div>
        )}

        {/* ── WhatsApp (solo owner o si ya fue aprobado — simplificado) ── */}
        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Contacto
            </h2>
            {editing ? (
              <div className="flex">
                <span className="px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-500">
                  +51
                </span>
                <input
                  type="tel"
                  placeholder="999 999 999"
                  value={draft.whatsapp}
                  onChange={(e) =>
                    setDraft({ ...draft, whatsapp: e.target.value })
                  }
                  className="flex-1 px-4 py-2.5 rounded-r-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3] transition-colors"
                />
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
        {(user.github || user.linkedin || user.portfolio) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Links
            </h2>
            <div className="flex flex-col gap-2">
              {user.github && (
                <a
                  href={user.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1a4ca3] transition-colors"
                >
                  <FaGithub size={15} /> {user.github}
                </a>
              )}
              {user.linkedin && (
                <a
                  href={user.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1a4ca3] transition-colors"
                >
                  <FaLinkedin size={15} /> {user.linkedin}
                </a>
              )}
              {user.portfolio && (
                <a
                  href={user.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1a4ca3] transition-colors"
                >
                  <Globe size={15} /> {user.portfolio}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
