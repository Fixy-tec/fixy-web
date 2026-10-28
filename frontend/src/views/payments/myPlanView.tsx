"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Crown,
  Eye,
  Loader2,
  Lock,
  Target,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import ProBadge from "@/src/components/ProBadge";
import DemoBadge from "@/src/components/payments/DemoBadge";
import {
  fetchMyPayments,
  fetchProStats,
  formatDateTime,
  formatPen,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_STYLE,
  paymentMethodLabel,
  type MyPaymentsDto,
  type ProStatsDto,
} from "@/src/lib/payment";

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <Icon className="w-4 h-4 text-[#1a4ca3] mb-2" />
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function ProStats({ stats }: { stats: ProStatsDto }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatTile icon={Eye} label="Visitas a tu perfil" value={String(stats.profileViews)} />
      <StatTile
        icon={Target}
        label="Tasa de aceptación"
        value={`${stats.acceptanceRate}%`}
        hint={`${stats.applicationsAccepted} de ${stats.applicationsSent} postulaciones`}
      />
      <StatTile
        icon={Wallet}
        label="Ganado en asesorías"
        value={formatPen(stats.earnings.totalCents)}
        hint={`${stats.earnings.count} pago${stats.earnings.count === 1 ? "" : "s"} liberado${stats.earnings.count === 1 ? "" : "s"}`}
      />
      <StatTile
        icon={BarChart3}
        label="En garantía"
        value={formatPen(stats.earnings.heldCents)}
        hint={`${stats.requestsCompleted}/${stats.requestsCreated} solicitudes completadas`}
      />
    </div>
  );
}

function LockedStats() {
  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 blur-sm select-none" aria-hidden>
        {["128", "76%", "S/ 240.00", "S/ 30.00"].map((v) => (
          <div key={v} className="rounded-xl bg-gray-50 p-4">
            <p className="text-2xl font-bold text-gray-300">{v}</p>
            <p className="text-xs text-gray-300">Estadística</p>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 text-center px-4">
        <Lock className="w-5 h-5 text-gray-500 mb-2" />
        <p className="font-semibold text-gray-800">Estadísticas exclusivas de Pro</p>
        <p className="text-xs text-gray-500 mb-3">
          Visitas a tu perfil, tasa de aceptación y tus ganancias.
        </p>
        <Link
          href="/planes"
          className="text-sm font-semibold text-white bg-[#1a4ca3] hover:bg-[#143d87] px-4 py-2 rounded-xl"
        >
          Ver planes
        </Link>
      </div>
    </div>
  );
}

export default function MyPlanView() {
  const { token, user } = useAuth();
  const [data, setData] = useState<MyPaymentsDto | null>(null);
  const [stats, setStats] = useState<ProStatsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchMyPayments(token)
      .then((d) => {
        setData(d);
        if (d.plan.isPro) {
          fetchProStats(token).then(setStats).catch(() => setStats(null));
        }
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No se pudieron cargar tus pagos"),
      );
  }, [token]);

  if (error) {
    return <p className="text-center text-sm text-rose-600 py-20">{error}</p>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  const { plan, payments } = data;

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">Mi plan y pagos</h1>

        {/* Plan */}
        {plan.isPro ? (
          <div className="rounded-3xl p-6 text-white bg-gradient-to-br from-[#1a4ca3] to-[#057f78] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ProBadge size="md" />
                <span className="text-white/80 text-sm">Plan activo</span>
              </div>
              <p className="text-xl font-bold">Helpy Pro</p>
              <p className="text-sm text-white/80">
                Vence el {formatDateTime(plan.planExpiresAt)}
              </p>
            </div>
            <Link
              href="/checkout"
              className="text-center text-sm font-semibold bg-white text-[#1a4ca3] px-5 py-2.5 rounded-xl hover:bg-white/90"
            >
              Renovar y sumar tiempo
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl p-6 bg-white border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Plan actual</p>
              <p className="text-xl font-bold text-gray-800">Free</p>
              <p className="text-sm text-gray-500">
                Publica y postula sin límites, destaca tus solicitudes y cobra sin comisión con Pro.
              </p>
            </div>
            <Link
              href="/planes"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-[#1a4ca3] hover:bg-[#143d87] px-5 py-2.5 rounded-xl"
            >
              <Crown className="w-4 h-4" />
              Mejorar a Pro
            </Link>
          </div>
        )}

        {/* Estadísticas */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Estadísticas
          </h2>
          {plan.isPro ? (
            stats ? (
              <ProStats stats={stats} />
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#1a4ca3]" />
              </div>
            )
          ) : (
            <LockedStats />
          )}
        </section>

        {/* Historial */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Historial
          </h2>
          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-500">
              Aún no tienes pagos.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {payments.map((p) => {
                const incoming = p.payee?.id === user?.id && p.payer.id !== user?.id;
                return (
                  <Link
                    key={p.id}
                    href={`/pagos/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        incoming ? "bg-emerald-50 text-emerald-600" : "bg-[#eff4ff] text-[#1a4ca3]"
                      }`}
                    >
                      {incoming ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {p.description}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                        {formatDateTime(p.createdAt)} · {paymentMethodLabel(p)}
                        {p.mode === "TEST" && <DemoBadge detail={false} />}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${incoming ? "text-emerald-600" : "text-gray-800"}`}>
                        {incoming ? "+" : ""}
                        {formatPen(incoming && p.payoutCents != null ? p.payoutCents : p.amountCents)}
                      </p>
                      <span
                        className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${PAYMENT_STATUS_STYLE[p.status]}`}
                      >
                        {PAYMENT_STATUS_LABEL[p.status]}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
