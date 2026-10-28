"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useAdmin } from "@/src/context/AdminContext";
import { useToast } from "@/src/context/ToastContext";
import RoiChart, { formatRoiPct } from "@/src/components/admin/RoiChart";
import DemoBadge from "@/src/components/payments/DemoBadge";
import { getRoiReport, type RoiReportDto } from "@/src/lib/admin";
import { formatPen } from "@/src/lib/payment";

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function signedPen(cents: number): string {
  return `${cents < 0 ? "−" : ""}${formatPen(Math.abs(cents))}`;
}

// ── ROI: el número, la fórmula y qué significa ─────────────────────────────

function RoiHero({ report }: { report: RoiReportDto }) {
  const positive = report.roi >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const perSol = report.revenueCents / report.investmentCents;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 h-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-gray-500">
          ROI · retorno sobre la inversión
        </p>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            positive
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {positive ? "Inversión recuperada" : "Recuperando la inversión"}
        </span>
      </div>

      <p className="text-5xl sm:text-6xl font-bold text-gray-900 my-3">
        {formatRoiPct(report.roi)}
      </p>

      <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm">
        <p className="text-xs text-gray-400 mb-1">{report.formula}</p>
        <p className="font-mono text-gray-700 break-words">
          ({formatPen(report.revenueCents)} −{" "}
          {formatPen(report.investmentCents)}) ÷{" "}
          {formatPen(report.investmentCents)} = {formatRoiPct(report.roi)}
        </p>
      </div>

      <p className="text-sm text-gray-600 mt-3 leading-relaxed">
        {positive ? (
          <>
            Ya recuperaste los {formatPen(report.investmentCents)} invertidos y
            ganaste{" "}
            <span className="font-semibold">
              {formatPen(report.profitCents)}
            </span>{" "}
            extra.
          </>
        ) : (
          <>
            Un ROI de{" "}
            <span className="font-semibold">{formatRoiPct(report.roi)}</span>{" "}
            significa que todavía falta recuperar el{" "}
            <span className="font-semibold">
              {Math.abs(report.roi * 100).toFixed(1)}%
            </span>{" "}
            de lo invertido. Por cada S/ 1.00 invertido, la app generó{" "}
            <span className="font-semibold">S/ {perSol.toFixed(2)}</span>.
          </>
        )}
      </p>
    </div>
  );
}

// ── Cuánto falta para recuperar la inversión ───────────────────────────────

function RecoveryCard({ report }: { report: RoiReportDto }) {
  const pct = Math.min(1, report.recovered);
  const done = report.remainingCents === 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 h-full flex flex-col">
      <p className="text-sm font-semibold text-gray-500">
        ¿Cuánto falta para recuperar la inversión?
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-3">
        {formatPen(Math.min(report.revenueCents, report.investmentCents))}
        <span className="text-base font-medium text-gray-400">
          {" "}
          de {formatPen(report.investmentCents)}
        </span>
      </p>

      {/* Medidor: mismo verde, pista más clara */}
      <div
        className="mt-3 h-3 rounded-full bg-[#d7efec] overflow-hidden"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct * 100)}
        aria-label="Inversión recuperada"
      >
        <div
          className="h-full rounded-full bg-[#057f78]"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1.5">
        {(report.recovered * 100).toFixed(1)}% recuperado
      </p>

      <div className="mt-auto pt-4 text-sm text-gray-600 leading-relaxed">
        {done ? (
          <p>
            <span className="font-semibold text-gray-800">
              ¡Inversión recuperada!
            </span>{" "}
            Cada venta nueva ya es ganancia.
          </p>
        ) : (
          <p>
            Faltan{" "}
            <span className="font-semibold text-gray-800">
              {formatPen(report.remainingCents)}
            </span>
            : unos{" "}
            <span className="font-semibold text-gray-800">
              {report.salesToBreakEven.yearlyPlans} planes anuales
            </span>{" "}
            ({formatPen(report.prices.proYearlyCents)} c/u) o{" "}
            <span className="font-semibold text-gray-800">
              {report.salesToBreakEven.monthlyPlans} mensuales
            </span>{" "}
            ({formatPen(report.prices.proMonthlyCents)} c/u).
          </p>
        )}
      </div>
    </div>
  );
}

// ── Vista ──────────────────────────────────────────────────────────────────

export default function AdminKpisView() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [report, setReport] = useState<RoiReportDto | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    getRoiReport(token)
      .then(setReport)
      .catch((e: unknown) =>
        showToast(
          e instanceof Error
            ? e.message
            : "No se pudieron cargar los indicadores",
          "error",
        ),
      );
  }, [token, showToast]);

  // Se recalcula con cada evento del socket admin (cada venta o garantía
  // liberada): el ROI se ve avanzar paso a paso sin recargar la página.
  const { dashboard } = useAdmin();
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getRoiReport(token)
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch((e: unknown) =>
        showToast(
          e instanceof Error
            ? e.message
            : "No se pudieron cargar los indicadores",
          "error",
        ),
      );
    return () => {
      cancelled = true;
    };
  }, [token, showToast, dashboard]);

  if (!report || !token) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#057f78]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-800">Indicadores</h2>
            {/* <DemoBadge detail={false} /> */}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ROI con las ventas hechas en la app.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#057f78] hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar indicadores
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <RoiHero report={report} />
        <RecoveryCard report={report} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Ingresos"
          value={formatPen(report.revenueCents)}
          hint={`Planes ${formatPen(report.revenue.plansCents)} · comisiones ${formatPen(report.revenue.commissionsCents)}`}
        />
        <StatTile
          label="Inversión del proyecto"
          value={formatPen(report.investmentCents)}
          hint="Monto fijo"
        />
        <StatTile
          label="Utilidad"
          value={signedPen(report.profitCents)}
          hint="Ingresos − inversión"
        />
        <StatTile
          label="Planes Pro vendidos"
          value={String(report.plansSold)}
          hint={`${report.activeProUsers} usuarios Pro activos`}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-[#057f78]" />
          <h3 className="font-bold text-gray-800">
            Cómo avanza el ROI con cada venta
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Cada venta sube un escalón la línea azul. Cuando alcanza la línea
          naranja (la inversión), el ROI llega a 0% y desde ahí todo es
          ganancia.
        </p>
        <RoiChart
          steps={report.steps}
          investmentCents={report.investmentCents}
          breakEvenSale={report.breakEvenSale}
        />
      </div>
    </div>
  );
}
