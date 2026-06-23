"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/src/context/AdminContext";
import AdminLogTimeline from "@/src/components/admin/AdminLogTimeline";
import FixoMascot from "@/src/components/admin/FixoMascot";

export default function AdminLogsView() {
  const { logs, refreshLogs, logsPagination, isLoading } = useAdmin();
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    void refreshLogs({
      page: 1,
      limit: 30,
      action: action || undefined,
      from: from || undefined,
      to: to || undefined,
    });
  }, [action, from, to, refreshLogs]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Logs administrativos</h2>
      <p className="text-sm text-gray-500 mb-6">
        Auditoría de acciones realizadas por administradores.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Filtrar por acción"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {logs.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <FixoMascot
              variant="money"
              size={100}
              className="mx-auto mb-3 opacity-90"
            />
            <p className="text-gray-500 text-sm">No hay registros con estos filtros</p>
          </div>
        ) : (
          <AdminLogTimeline logs={logs} loading={isLoading} />
        )}
        {logsPagination && logsPagination.totalPages > 1 && (
          <p className="text-xs text-gray-400 text-center mt-6">
            Página {logsPagination.page} de {logsPagination.totalPages} ·{" "}
            {logsPagination.total} registros
          </p>
        )}
      </div>
    </div>
  );
}
