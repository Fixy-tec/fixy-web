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
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/src/context/AuthContext";
import {
  getAdminDashboard,
  getAdminLogs,
  isAdmin,
  SOCKET_BASE,
  type AdminLogDto,
  type DashboardDto,
  type ListLogsParams,
} from "@/src/lib/admin";

interface AdminContextValue {
  dashboard: DashboardDto | null;
  logs: AdminLogDto[];
  isLoading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
  refreshLogs: (params?: ListLogsParams) => Promise<void>;
  logsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { token, user, isAuthenticated } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [logs, setLogs] = useState<AdminLogDto[]>([]);
  const [logsPagination, setLogsPagination] =
    useState<AdminContextValue["logsPagination"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const logsParamsRef = useRef<ListLogsParams>({ page: 1, limit: 20 });

  useEffect(() => {
    tokenRef.current = token ?? null;
  }, [token]);

  const refreshDashboard = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboard(t);
      setDashboard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshLogs = useCallback(async (params?: ListLogsParams) => {
    const t = tokenRef.current;
    if (!t) return;
    if (params) logsParamsRef.current = { ...logsParamsRef.current, ...params };
    try {
      const result = await getAdminLogs(t, logsParamsRef.current);
      setLogs(result.logs);
      setLogsPagination(result.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar logs");
    }
  }, []);

  // Socket.IO — namespace /admin (mismo patrón que NotificationContext polling)
  useEffect(() => {
    if (!isAuthenticated || !token || !isAdmin(user)) {
      setDashboard(null);
      setLogs([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    void refreshDashboard();
    void refreshLogs();

    const socket = io(`${SOCKET_BASE}/admin`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("admin:dashboard:update", (payload: DashboardDto) => {
      setDashboard(payload);
      void refreshLogs();
    });

    socket.on("connect_error", (err) => {
      console.warn("[admin socket]", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, user, refreshDashboard, refreshLogs]);

  const value = useMemo<AdminContextValue>(
    () => ({
      dashboard,
      logs,
      isLoading,
      error,
      refreshDashboard,
      refreshLogs,
      logsPagination,
    }),
    [
      dashboard,
      logs,
      isLoading,
      error,
      refreshDashboard,
      refreshLogs,
      logsPagination,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin debe usarse dentro de AdminProvider");
  }
  return ctx;
}
