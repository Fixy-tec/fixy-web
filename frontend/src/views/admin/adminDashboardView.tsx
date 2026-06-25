"use client";

import { Users, FileText, ClipboardList, TrendingUp } from "lucide-react";
import { useAdmin } from "@/src/context/AdminContext";
import ExpandableMetricCard from "@/src/components/admin/ExpandableMetricCard";
import AdminLogTimeline from "@/src/components/admin/AdminLogTimeline";
import FixoMascot from "@/src/components/admin/FixoMascot";

export default function AdminDashboardView() {
  const { dashboard, logs, isLoading, error } = useAdmin();
  const loading = isLoading && !dashboard;

  const topActive =
    dashboard?.metrics.mostActiveUsers
      .slice(0, 3)
      .map((u) => u.name)
      .join(", ") || "—";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="relative bg-linear-to-r from-[#057f78] via-[#046d67] to-[#1a4ca3] rounded-3xl p-8 text-white shadow-lg overflow-hidden mb-8">
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#1a4ca3] opacity-20 rounded-full blur-[80px]" />
        <h2 className="text-2xl font-bold relative z-10">Dashboard</h2>
        <p className="text-white/80 mt-2 relative z-10 text-sm max-w-xl">
          Resumen del ecosistema Fixy. Expande cada card para ver el detalle.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <ExpandableMetricCard
          title="Usuarios"
          mainLabel="Total registrados"
          mainValue={dashboard?.users.total ?? 0}
          icon={Users}
          accent="blue"
          loading={loading}
          metrics={[
            { label: "Usuarios activos", value: dashboard?.users.active ?? 0, highlight: true },
            { label: "Rol USER", value: dashboard?.users.byRole.USER ?? 0 },
            { label: "Rol ADMIN", value: dashboard?.users.byRole.ADMIN ?? 0 },
            { label: "Usuarios más activos", value: topActive },
          ]}
        />
        <ExpandableMetricCard
          title="Requests"
          mainLabel="Abiertos"
          mainValue={dashboard?.requests.open ?? 0}
          icon={FileText}
          accent="teal"
          loading={loading}
          expandLabel="Ver estados"
          metrics={[
            { label: "Abiertos", value: dashboard?.requests.open ?? 0 },
            { label: "En revisión", value: dashboard?.requests.review ?? 0 },
            { label: "En proceso", value: dashboard?.requests.processing ?? 0, highlight: true },
            { label: "Completados", value: dashboard?.requests.completed ?? 0 },
            { label: "Cancelados", value: dashboard?.requests.cancelled ?? 0 },
          ]}
        />
        <ExpandableMetricCard
          title="Applications"
          mainLabel="Pendientes"
          mainValue={dashboard?.applications.pending ?? 0}
          icon={ClipboardList}
          accent="blue"
          loading={loading}
          expandLabel="Ver estados"
          metrics={[
            { label: "Pendientes", value: dashboard?.applications.pending ?? 0 },
            { label: "Aceptadas", value: dashboard?.applications.accepted ?? 0, highlight: true },
            { label: "Rechazadas", value: dashboard?.applications.rejected ?? 0 },
          ]}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#057f78]" />
            <h3 className="font-bold text-gray-800">Métricas adicionales</h3>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <dt className="text-gray-500">Promedio apps / request</dt>
              <dd className="font-semibold text-gray-800">
                {dashboard?.metrics.avgApplicationsPerRequest ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <dt className="text-gray-500">Tasa de aceptación</dt>
              <dd className="font-semibold text-[#009c70]">
                {dashboard ? `${dashboard.metrics.acceptanceRate}%` : "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-gray-500">Requests últimos 7 días</dt>
              <dd className="font-semibold text-[#1a4ca3]">
                {dashboard?.metrics.requestsLast7Days ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Actividad reciente</h3>
          {logs.length === 0 && !isLoading ? (
            <div className="text-center py-6">
              <FixoMascot
                variant="arte"
                size={100}
                className="mx-auto opacity-90 mb-3"
              />
              <p className="text-sm text-gray-500">No hay actividad reciente</p>
            </div>
          ) : (
            <AdminLogTimeline logs={logs.slice(0, 8)} loading={isLoading && logs.length === 0} />
          )}
        </div>
      </div>
    </div>
  );
}
