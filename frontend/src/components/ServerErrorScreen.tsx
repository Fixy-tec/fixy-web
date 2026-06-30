"use client";

import { ServerCrash, RefreshCw } from "lucide-react";

interface ServerErrorScreenProps {
  /** Mensaje principal a mostrar. Si no se pasa, usa el texto por defecto. */
  message?: string;
  /** Acción al presionar "Reintentar". Si no se pasa, recarga la página. */
  onRetry?: () => void;
  /** Si es true, ocupa toda la pantalla. Si es false, se muestra como bloque inline. */
  fullScreen?: boolean;
}

/**
 * Pantalla / bloque de error para cuando el backend no responde
 * (servidor caído, timeout de red, fetch fallido, etc.).
 *
 * Uso típico: en un catch de fetch, en vez de mostrar e.message crudo,
 * renderizar <ServerErrorScreen onRetry={refetch} />.
 */
export default function ServerErrorScreen({
  message = "No pudimos conectar con el servidor. Esto puede deberse a una caída temporal o a problemas de conexión.",
  onRetry,
  fullScreen = true,
}: ServerErrorScreenProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={
        fullScreen
          ? "min-h-screen flex items-center justify-center bg-[#fefefe] px-4"
          : "flex items-center justify-center px-4 py-10"
      }
    >
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ServerCrash size={32} strokeWidth={1.8} className="text-red-500" />
        </div>

        <h1 className="text-xl font-semibold text-gray-700 mb-2">
          Servidor no disponible
        </h1>

        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {message}
        </p>

        <button
          onClick={handleRetry}
          className="inline-flex items-center justify-center gap-2 bg-[#057f78] hover:bg-[#05605c] text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm"
        >
          <RefreshCw size={16} strokeWidth={2} />
          Reintentar
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Si el problema persiste, intenta nuevamente en unos minutos.
        </p>
      </div>
    </div>
  );
}