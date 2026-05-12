"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, Sparkles, Bell, Flame, ChevronRight } from "lucide-react";
import Image from "next/image";

const HomeLoggedView = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* HERO */}
          <div className="lg:col-span-7 rounded-4xl overflow-hidden relative bg-linear-to-br from-[#057f78] via-[#046d67] to-[#1a4ca3] p-8 text-white min-h-80 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Sparkles size={16} />
                Recomendaciones inteligentes activas
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mt-5 leading-tight">
                Bienvenido, Gabriel
              </h1>

              <p className="text-white/80 mt-5 max-w-xl leading-relaxed">
                Encontramos nuevas solicitudes compatibles con tus habilidades
                en React, Node.js y Docker.
              </p>

              <div className="flex flex-wrap gap-2 mt-6">
                {["React", "Node.js", "Docker", "UI/UX"].map((tag) => (
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
                onClick={() => router.push("/find")}
                className="bg-white text-[#1a4ca3] px-5 py-3 rounded-2xl font-semibold hover:opacity-90 transition"
              >
                Explorar solicitudes
              </button>

              <button
                onClick={() => router.push("/applications/new")}
                className="bg-white/10 border border-white/20 px-5 py-3 rounded-2xl font-medium hover:bg-white/20 transition"
              >
                Crear solicitud
              </button>
            </div>
          </div>

          {/* PERFIL */}
          <div className="lg:col-span-5 bg-white border border-gray-100 rounded-4xl p-6 shadow-sm flex flex-col justify-between min-h-80">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">Tu progreso</p>

                <h2 className="text-4xl font-bold text-gray-800 mt-3">Plata</h2>

                <p className="text-gray-500 mt-2">920 puntos acumulados</p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#1a4ca3] to-[#009c70] flex items-center justify-center text-white text-2xl">
                🏆
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Progreso a Oro</span>

                <span className="text-sm font-semibold text-[#1a4ca3]">
                  65%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-[#1a4ca3] to-[#009c70]" />
              </div>

              <p className="text-xs text-gray-400 mt-3">
                880 pts restantes para subir de medalla
              </p>
            </div>

            {/* mini stats */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              <MiniStat title="Ranking" value="#10" />
              <MiniStat title="Rating" value="4.9⭐" />
              <MiniStat title="Completadas" value="12" />
            </div>
          </div>

          {/* ACTIVIDAD */}
          <div className="lg:col-span-6 bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Bell size={16} className="text-gray-400" />

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Actividad reciente
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Tu postulación fue aceptada",
                "Recibiste una calificación de 5 estrellas",
                "Subiste a Plata II",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50"
                >
                  <div className="w-2 h-2 rounded-full bg-[#009c70]" />

                  <p className="text-sm text-gray-600">{item}</p>
                </div>
              ))}
            </div>
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
          <div className="lg:col-span-12 bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a4ca3] to-[#009c70]" />

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
          </div>
        </div>
      </div>
    </div>
  );
};

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] border border-gray-100 p-4">
      <p className="text-xs text-gray-400">{title}</p>

      <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}

export default HomeLoggedView;
