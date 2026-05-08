"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Send } from "lucide-react";
import SolicitudCard, { Solicitud } from "@/src/components/cards/solicitudCard";

type Tab = "mis-solicitudes" | "mis-postulaciones";

// ── Hardcoded data ───────────────────────────────────────────────────────────
const MIS_SOLICITUDES: Solicitud[] = [
  {
    id: 1,
    tipo: "Asesoría",
    titulo: "Necesito ayuda con consultas SQL avanzadas",
    descripcion:
      "Tengo un parcial la próxima semana y no entiendo JOINs ni subconsultas. Busco alguien que me explique con ejemplos prácticos.",
    tags: ["SQL", "PostgreSQL"],
    dificultad: 2,
    fechaLimite: "2025-05-20",
    fechaPublicacion: "2025-05-10",
    postulantes: 3,
    participantes: 1,
    status: "Abierta",
    autor: "Tú",
  },
  {
    id: 2,
    tipo: "Proyecto",
    titulo: "App de delivery con Flutter",
    descripcion:
      "Tengo el diseño en Figma. Busco socio para el frontend móvil.",
    tags: ["Flutter", "Dart"],
    dificultad: 4,
    fechaLimite: "2025-06-01",
    fechaPublicacion: "2025-05-08",
    postulantes: 5,
    participantes: 2,
    beneficio: "S/. 200",
    status: "Completada",
    autor: "Tú",
  },
];

const MIS_POSTULACIONES: Solicitud[] = [
  {
    id: 3,
    tipo: "Asesoría",
    titulo: "Revisión de proyecto Django REST Framework",
    descripcion:
      "Necesitan revisar una API con JWT. Me postulé con mi experiencia en Django.",
    tags: ["Python", "Django"],
    dificultad: 3,
    fechaLimite: "2025-05-18",
    fechaPublicacion: "2025-05-07",
    postulantes: 1,
    participantes: 1,
    status: "En proceso",
    autor: "Andrés P.",
  },
  {
    id: 4,
    tipo: "Proyecto",
    titulo: "Sistema IoT para monitoreo de temperatura",
    descripcion: "Proyecto con Arduino y sensores. Me postulé para el backend.",
    tags: ["Arduino", "IoT", "Python"],
    dificultad: 3,
    fechaLimite: "2025-05-25",
    fechaPublicacion: "2025-05-06",
    postulantes: 2,
    participantes: 1,
    status: "Cancelada",
    autor: "Lucía F.",
  },
];

export default function ApplicationsView() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("mis-solicitudes");

  const data = tab === "mis-solicitudes" ? MIS_SOLICITUDES : MIS_POSTULACIONES;
  const misSolicitudesActivas = MIS_SOLICITUDES.filter(
    (s) => s.status === "Abierta",
  ).length;

  const handleCardClick = (s: Solicitud) => {
    router.push(`/applications/${s.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative bg-linear-to-r from-[#057f78] via-[#046d67] to-[#1a4ca3] rounded-3xl p-8 text-white shadow-lg overflow-hidden mb-8">
          {/* Blobs decorativos */}
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#1a4ca3] opacity-20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-[#057f78] opacity-20 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-1/3 w-36 h-36 bg-white opacity-5 rounded-full blur-[60px]" />

          {/* Contenido */}
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Mis Solicitudes
              </h1>
              <p className="text-sm text-white/60 mt-0.5">
                Gestiona tus solicitudes y postulaciones
              </p>
            </div>
            <button
              onClick={() => router.push("/applications/crear")}
              className="flex items-center gap-2 bg-black/30 hover:bg-black/50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm self-start sm:self-auto border border-white/10 backdrop-blur-sm"
            >
              <Plus size={16} strokeWidth={2.5} />
              Crear solicitud
            </button>
          </div>
        </div>

        {/* Advertencia si tiene más de 3 abiertas (RF-S10) */}
        {misSolicitudesActivas >= 3 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 flex items-center gap-2">
            ⚠️ Tienes {misSolicitudesActivas} solicitudes activas. Tener muchas
            abiertas puede saturar el feed.
          </div>
        )}

        {/* Switch tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit mb-6">
          <button
            onClick={() => setTab("mis-solicitudes")}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{
              background: tab === "mis-solicitudes" ? "#057f78" : "transparent",
              color: tab === "mis-solicitudes" ? "white" : "#6b7280",
            }}
          >
            <FileText size={14} strokeWidth={2} />
            Mis solicitudes
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                background:
                  tab === "mis-solicitudes"
                    ? "rgba(255,255,255,0.2)"
                    : "#f3f4f6",
                color: tab === "mis-solicitudes" ? "white" : "#6b7280",
              }}
            >
              {MIS_SOLICITUDES.length}
            </span>
          </button>

          <button
            onClick={() => setTab("mis-postulaciones")}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{
              background:
                tab === "mis-postulaciones" ? "#057f78" : "transparent",
              color: tab === "mis-postulaciones" ? "white" : "#6b7280",
            }}
          >
            <Send size={14} strokeWidth={2} />
            Mis postulaciones
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                background:
                  tab === "mis-postulaciones"
                    ? "rgba(255,255,255,0.2)"
                    : "#f3f4f6",
                color: tab === "mis-postulaciones" ? "white" : "#6b7280",
              }}
            >
              {MIS_POSTULACIONES.length}
            </span>
          </button>
        </div>

        {/* Grid de cards */}
        {data.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {data.map((s) => (
              <SolicitudCard
                key={s.id}
                solicitud={s}
                onClick={handleCardClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {tab === "mis-solicitudes"
                ? "No has creado ninguna solicitud aún."
                : "No te has postulado a ninguna solicitud aún."}
            </p>
            {tab === "mis-solicitudes" && (
              <button
                onClick={() => router.push("/applications/crear")}
                className="mt-4 text-sm text-[#1a4ca3] hover:underline font-medium"
              >
                Crear mi primera solicitud
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
