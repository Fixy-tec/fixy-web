"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  deleteNotification as apiDeleteNotification,
  clearAllNotifications as apiClearAllNotifications,
  fetchNotifications,
  type NotificationDto,
} from "@/src/lib/notification";

interface NotificationContextValue {
  notifications: NotificationDto[];
  isLoading: boolean;
  error: string | null;
  /** Vuelve a pedir la lista al backend. */
  refresh: () => Promise<void>;
  /** "Marcar como visto" — elimina la notificación. */
  markAsSeen: (id: string) => Promise<void>;
  /** Borra TODAS las notificaciones del usuario. */
  clearAll: () => Promise<void>;
  /** Cantidad total de notificaciones (sirve como badge). */
  unseenCount: number;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

const POLL_INTERVAL_MS = 30_000;
const DEFAULT_LIMIT = 30;

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    tokenRef.current = token ?? null;
  }, [token]);

  const refresh = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchNotifications(t, { limit: DEFAULT_LIMIT });
      setNotifications(list);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al cargar notificaciones",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling: cada 30s mientras la pestaña esté visible. Refresh inmediato
  // al volver a foco.
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      return;
    }

    void refresh();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [isAuthenticated, token, refresh]);

  const markAsSeen = useCallback(async (id: string) => {
    const t = tokenRef.current;
    if (!t) return;
    // Optimistic: quitamos al toque del estado local, si falla revertimos.
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiDeleteNotification(t, id);
    } catch (e) {
      setNotifications(previous);
      setError(
        e instanceof Error ? e.message : "No se pudo marcar como visto",
      );
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    const previous = notifications;
    setNotifications([]);
    try {
      await apiClearAllNotifications(t);
    } catch (e) {
      setNotifications(previous);
      setError(
        e instanceof Error ? e.message : "No se pudieron borrar",
      );
    }
  }, [notifications]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      isLoading,
      error,
      refresh,
      markAsSeen,
      clearAll,
      unseenCount: notifications.length,
    }),
    [notifications, isLoading, error, refresh, markAsSeen, clearAll],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications debe usarse dentro de NotificationProvider",
    );
  }
  return ctx;
}
