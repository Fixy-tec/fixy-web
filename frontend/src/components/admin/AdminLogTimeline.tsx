"use client";

import type { AdminLogDto } from "@/src/lib/admin";

const ACTION_LABELS: Record<string, string> = {
  CHANGE_ROLE: "Cambió el rol de un usuario",
  SOFT_DELETE_USER: "Desactivó un usuario",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AdminLogTimelineProps {
  logs: AdminLogDto[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function AdminLogTimeline({
  logs,
  loading = false,
  emptyMessage = "No hay actividad reciente",
}: AdminLogTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-3 h-3 rounded-full bg-gray-200 mt-1.5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">{emptyMessage}</p>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-linear-to-b from-[#057f78] to-[#1a4ca3] opacity-30" />
      <ul className="space-y-5">
        {logs.map((log) => (
          <li key={log.id} className="flex gap-4 relative pl-1">
            <span className="w-3 h-3 rounded-full bg-[#057f78] ring-4 ring-[#effaf8] shrink-0 mt-1 z-10" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {ACTION_LABELS[log.action] ?? log.action}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{log.description}</p>
              {log.targetUser && (
                <p className="text-xs text-[#1a4ca3] mt-1">
                  Usuario: {log.targetUser.name}
                </p>
              )}
              <p className="text-[10px] text-gray-400 mt-1">
                {log.admin.name} · {formatDate(log.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
