"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRequest } from "@/src/context/RequestContext";
import SolicitudDetailView from "@/src/views/applications/solicitudDetailView";
import SolicitudDetailViewCreator from "@/src/views/applications/solicitudDetailViewCreator";

export default function SolicitudDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    currentDetail,
    isLoadingDetail,
    detailError,
    loadRequestDetail,
    clearRequestDetail,
  } = useRequest();

  const requestId = typeof params.id === "string" ? params.id : params.id?.[0];

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }
    if (!requestId) return;

    void loadRequestDetail(requestId);
    return () => clearRequestDetail();
  }, [
    authLoading,
    isAuthenticated,
    requestId,
    loadRequestDetail,
    clearRequestDetail,
    router,
  ]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  if (isLoadingDetail) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  if (detailError || !currentDetail) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-red-600 mb-4">
          {detailError ?? "No se encontró la solicitud"}
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

  const isOwner = user?.id === currentDetail.creatorId;

  return isOwner ? (
    <SolicitudDetailViewCreator solicitud={currentDetail} />
  ) : (
    <SolicitudDetailView solicitud={currentDetail} />
  );
}
