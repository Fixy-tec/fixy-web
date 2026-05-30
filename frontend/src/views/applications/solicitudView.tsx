"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Send, Loader2 } from "lucide-react";
import SolicitudCard, { Solicitud } from "@/src/components/cards/solicitudCard";
import { useAuth } from "@/src/context/AuthContext";
import { useRequest } from "@/src/context/RequestContext";

type Tab = "mis-solicitudes" | "mis-postulaciones";

export default function ApplicationsView() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    myRequests,
    myApplications,
    isLoadingLists,
    listsError,
    refreshLists,
  } = useRequest();

  const [tab, setTab] = useState<Tab>("mis-solicitudes");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/forbidden?from=/applications");
      return;
    }
    void refreshLists();
  }, [authLoading, isAuthenticated, refreshLists, router]);

  const data = tab === "mis-solicitudes" ? myRequests : myApplications;
  const misSolicitudesActivas = myRequests.filter(
    (s) => s.status === "Abierta",
  ).length;

  // Paginación
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const handleCardClick = (s: Solicitud) => {
    router.push(`/applications/${s.id}`);
  };

  // Reset a página 1 cuando cambia de tab
  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="relative bg-linear-to-r from-[#057f78] via-[#046d67] to-[#1a4ca3] rounded-3xl p-8 text-white shadow-lg overflow-hidden mb-8">
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#1a4ca3] opacity-20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-[#057f78] opacity-20 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-1/3 w-36 h-36 bg-white opacity-5 rounded-full blur-[60px]" />

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

        {misSolicitudesActivas >= 3 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 flex items-center gap-2">
            Tienes {misSolicitudesActivas} solicitudes activas. Tener muchas
            abiertas puede saturar el feed.
          </div>
        )}

        {listsError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {listsError}
          </div>
        )}

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
              {myRequests.length}
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
              {myApplications.length}
            </span>
          </button>
        </div>

        {isLoadingLists ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
          </div>
        ) : data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {paginatedData.map((s) => (
                <SolicitudCard
                  key={s.id}
                  solicitud={s}
                  onClick={handleCardClick}
                  showApplicants={tab === "mis-solicitudes"}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background:
                            currentPage === page ? "#1a4ca3" : "#f3f4f6",
                          color: currentPage === page ? "white" : "#6b7280",
                        }}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
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
