"use client";

import { useEffect } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRequest } from "@/src/context/RequestContext";
import CreateSolicitudView from "@/src/views/applications/createSolicitudView";

export default function EditSolicitudView() {
  const params = useParams();
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    isLoggingOut,
  } = useAuth();
  const {
    currentDetail,
    isLoadingDetail,
    detailError,
    detailNotFound,
    loadRequestDetail,
    clearRequestDetail,
  } = useRequest();

  const requestId = typeof params.id === "string" ? params.id : params.id?.[0];

  useEffect(() => {
    if (authLoading) return;
    if (isLoggingOut) return; // logout en curso → AuthContext navega
    if (!isAuthenticated) {
      const from = requestId
        ? `/applications/${requestId}/editar`
        : "/applications";
      router.replace(`/forbidden?from=${encodeURIComponent(from)}`);
      return;
    }
    if (!requestId) return;

    void loadRequestDetail(requestId);
    return () => clearRequestDetail();
  }, [
    authLoading,
    isAuthenticated,
    isLoggingOut,
    requestId,
    loadRequestDetail,
    clearRequestDetail,
    router,
  ]);

  if (authLoading || !isAuthenticated || isLoadingDetail || !requestId) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  if (detailNotFound) {
    notFound();
  }

  if (detailError || !currentDetail) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-red-600 mb-4">
          {detailError ?? "No se pudo cargar la solicitud"}
        </p>
        <button
          type="button"
          onClick={() => router.push("/applications")}
          className="text-sm text-[#1a4ca3] font-medium hover:underline"
        >
          Volver a mis solicitudes
        </button>
      </div>
    );
  }

  // Solo el dueño puede editar
  if (user?.id !== currentDetail.creatorId) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-red-600 mb-4">
          No tienes permisos para editar esta solicitud
        </p>
        <button
          type="button"
          onClick={() => router.push(`/applications/${requestId}`)}
          className="text-sm text-[#1a4ca3] font-medium hover:underline"
        >
          Volver al detalle
        </button>
      </div>
    );
  }

  return (
    <CreateSolicitudView
      mode="edit"
      initialData={currentDetail}
      requestId={requestId}
    />
  );
}
