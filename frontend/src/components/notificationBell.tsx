"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2, Trash2, X } from "lucide-react";
import { useNotifications } from "@/src/context/NotificationContext";
import {
  formatRelativeTime,
  getNotificationStyle,
  type NotificationDto,
} from "@/src/lib/notification";

/**
 * Campana flotante: dropdown anclado a la esquina superior derecha del navbar.
 * - Badge con la cantidad de notificaciones pendientes.
 * - Cada item tiene su botón "marcar como visto" (elimina del backend).
 * - Click sobre el item navega al recurso relacionado si hay `requestId`.
 */
export default function NotificationBell() {
  const router = useRouter();
  const { notifications, unseenCount, isLoading, markAsSeen, clearAll } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleItemClick = (n: NotificationDto) => {
    const requestId =
      typeof n.data?.requestId === "string" ? n.data.requestId : null;
    if (requestId) {
      router.push(`/applications/${requestId}`);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-[#1a4ca3] hover:bg-gray-50 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={18} strokeWidth={1.8} />
        {unseenCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unseenCount > 99 ? "99+" : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                Notificaciones
              </h3>
              {unseenCount > 0 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  {unseenCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => void clearAll()}
                  className="text-[11px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 px-2 py-1"
                  title="Borrar todas"
                >
                  <Trash2 size={11} strokeWidth={2} />
                  Borrar todas
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-[#1a4ca3]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-gray-50 mb-3">
                  <Bell size={18} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  No tienes notificaciones
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Te avisaremos cuando algo importante pase.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = getNotificationStyle(n.type);
                const clickable =
                  typeof n.data?.requestId === "string" && !!n.data.requestId;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                      clickable ? "hover:bg-gray-50 cursor-pointer" : ""
                    }`}
                    onClick={clickable ? () => handleItemClick(n) : undefined}
                  >
                    {/* Indicador */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: `${style.color}15`,
                        color: style.color,
                      }}
                    >
                      {style.emoji}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>

                    {/* Marcar como visto */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void markAsSeen(n.id);
                      }}
                      className="shrink-0 text-gray-300 hover:text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors"
                      title="Marcar como visto"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
