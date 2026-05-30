"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, Sparkles, Bell, Flame, ChevronRight, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useNotifications } from "@/src/context/NotificationContext";
import {
  formatRelativeTime,
  getNotificationStyle,
} from "@/src/lib/notification";

const HomeLoggedView = () => {
  const router = useRouter();
  const {
    notifications,
    isLoading: notifsLoading,
    markAsSeen,
  } = useNotifications();
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* HERO */}
          <div className="lg:col-span-7 rounded-4xl overflow-hidden relative bg-linear-to-br from-[#057f78] via-[#046d67] to-[#1a4ca3] p-8 text-white min-h-80 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl flex items-center gap-2 font-bold mt-5 leading-tight">
                <Sparkles size={30} />
                Bienvenido, Gabriel
              </h1>

              <p className="text-white/80 mt-5 max-w-xl leading-relaxed">
                Necesitas ayuda con un proyecto? Crea una solicitud y encuentra
                el mejor postulante para tu proyecto.
              </p>

              <div className="flex flex-wrap gap-2 mt-6">
                {["Crea", "Conecta", "Califica", "Comparte"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => router.push("/applications/crear")}
                className="bg-white text-[#1a4ca3] px-5 py-3 rounded-2xl font-semibold hover:opacity-90 transition"
              >
                Crear solicitud
              </button>
              <button
                onClick={() => router.push("/find")}
                className="bg-white/10 border border-white/20 px-5 py-3 rounded-2xl font-medium hover:bg-white/20 transition"
              >
                Explorar solicitudes
              </button>
            </div>
          </div>

          {/* PERFIL */}
          <div className="lg:col-span-5 relative overflow-hidden rounded-4xl min-h-80 shadow-sm">
            <Image
              src="/fixoNews.png"
              alt="Fixy News"
              fill
              priority
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/15" />

            <div className="absolute inset-0 bg-linear-to-br from-[#1a4ca3]/30 via-transparent to-[#057f78]/20" />

            {/* CONTENT */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              {/* TOP */}
              <div className="flex items-start justify-between gap-4">
                {/* Glass badge */}
                <div className="backdrop-blur-sm bg-white/10 border border-white/10 rounded-2xl px-4 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    Noticias
                  </p>
                </div>

                {/* Small indicator */}
                <div className="backdrop-blur-sm bg-white/10 border border-white/10 rounded-2xl px-3 py-2">
                  <span className="text-xs font-medium text-white">
                    Próximamente
                  </span>
                </div>
              </div>

              {/* BOTTOM CHAT-LIKE BAR */}
              <div className="absolute bottom-0 left-0 w-full">
                <div className="backdrop-blur-sm bg-black/20 border-t border-white/10 px-6 py-5">
                  <h2 className="text-lg font-bold text-white leading-tight">
                    El servidor de Minecraft de Fixy está en camino
                  </h2>
                  <p className="text-sm text-white/80 leading-relaxed max-w-2xl">
                    Estamos preparando un espacio para reuniones, eventos,
                    actividades y colaboración entre estudiantes dentro de
                    Minecraft.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVIDAD */}
          <div className="lg:col-span-6 bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Actividad reciente
                </p>
              </div>
              {recentNotifications.length > 0 && (
                <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  {notifications.length}
                </span>
              )}
            </div>

            {notifsLoading && recentNotifications.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-[#1a4ca3]" />
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-gray-50 mb-3">
                  <Bell size={18} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  Sin actividad reciente
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Cuando algo pase con tus solicitudes lo verás aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((n) => {
                  const style = getNotificationStyle(n.type);
                  const requestId =
                    typeof n.data?.requestId === "string"
                      ? n.data.requestId
                      : null;
                  const clickable = !!requestId;
                  return (
                    <div
                      key={n.id}
                      onClick={
                        clickable
                          ? () => router.push(`/applications/${requestId}`)
                          : undefined
                      }
                      className={`group flex items-start gap-3 p-4 rounded-2xl bg-gray-50 transition-colors ${
                        clickable ? "hover:bg-gray-100 cursor-pointer" : ""
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: `${style.color}15`,
                          color: style.color,
                        }}
                      >
                        {style.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 leading-tight">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void markAsSeen(n.id);
                        }}
                        className="shrink-0 text-gray-300 hover:text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors"
                        title="Marcar como visto"
                      >
                        <Check size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COMUNIDAD */}
          <div className="lg:col-span-6 rounded-[28px] p-6 bg-linear-to-br from-[#ffffff] to-[#f3f7ff] border border-[#dbe7ff] shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              <p className="text-xs font-semibold text-[#1a4ca3] uppercase tracking-widest">
                Comunidad
              </p>

              <h3 className="text-2xl font-bold text-gray-800 mt-4">
                Únete al Discord de Fixy
              </h3>

              <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-md">
                Comparte proyectos, consigue ayuda y conecta con otros
                estudiantes.
              </p>

              {/* IMAGE */}
              <div className="flex justify-center mt-4">
                <Image
                  src="/fixoDiscord.png"
                  alt="Fixy Discord"
                  width={260}
                  height={260}
                  className="object-contain drop-shadow-2xl select-none pointer-events-none animate-float"
                  priority
                />
              </div>
            </div>

            <button className="mt-6 w-fit bg-[#5865F2] text-white px-5 py-3 rounded-2xl font-medium hover:opacity-90 hover:scale-[1.02] transition-all">
              Unirse ahora
            </button>
          </div>

          {/* SOLICITUDES */}
          {/* <div className="lg:col-span-12 bg-white border border-gray-100 rounded-4xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Recomendado para ti
                </p>

                <h3 className="text-2xl font-bold text-gray-800 mt-2">
                  Solicitudes destacadas
                </h3>
              </div>

              <button className="text-sm text-[#1a4ca3] font-semibold flex items-center gap-1">
                Ver todas
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-[28px] border border-gray-100 bg-[#fafcff] hover:bg-white hover:shadow-md transition-all p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-3 py-1 rounded-full bg-[#eff4ff] text-[#1a4ca3] text-xs font-semibold">
                      React
                    </span>

                    <span className="text-sm font-bold text-[#009c70] whitespace-nowrap">
                      +180 pts
                    </span>
                  </div>

                  <h4 className="text-lg font-semibold text-gray-800 mt-5 leading-snug">
                    Optimizar componentes React con mal rendimiento
                  </h4>

                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                    Mi aplicación se rerenderiza constantemente y necesito
                    ayuda.
                  </p>

                  <div className="flex items-center gap-3 mt-6">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#1a4ca3] to-[#009c70]" />

                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Carlos Mendoza
                      </p>

                      <p className="text-xs text-gray-400">Hace 2 horas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default HomeLoggedView;
