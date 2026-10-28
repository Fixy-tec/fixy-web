"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoiStepDto } from "@/src/lib/admin";
import { formatDateTime, formatPen } from "@/src/lib/payment";

/**
 * Ingresos acumulados (escalera: sube con cada venta) contra la inversión fija
 * (línea horizontal). Misma unidad → un solo eje. Donde la escalera alcanza la
 * línea, el ROI llega a 0% y la inversión queda recuperada.
 * Paleta validada (CVD ΔE 24.7): azul = ingresos, naranja = inversión.
 */
const REVENUE_COLOR = "#2a78d6";
const INVESTMENT_COLOR = "#eb6834";

const HEIGHT = 280;
const PAD = { top: 18, right: 104, bottom: 34, left: 64 };

interface Point {
  label: string;
  cumulativeRevenueCents: number;
  roi: number;
  step: RoiStepDto | null;
}

function niceTicks(max: number, count = 4): number[] {
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * pow).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

function compactPen(cents: number): string {
  const soles = cents / 100;
  if (soles >= 1000) return `S/ ${(soles / 1000).toFixed(soles >= 10000 ? 0 : 1)}K`;
  return `S/ ${Math.round(soles)}`;
}

export function formatRoiPct(roi: number): string {
  const pct = roi * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

export default function RoiChart({
  steps,
  investmentCents,
  breakEvenSale,
}: {
  steps: RoiStepDto[];
  investmentCents: number;
  breakEvenSale: number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(320, Math.round(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [showTable]);

  // "Inicio" (S/ 0, ROI −100%) + un punto por cada venta.
  const points: Point[] = useMemo(
    () => [
      { label: "Inicio", cumulativeRevenueCents: 0, roi: -1, step: null },
      ...steps.map((s) => ({
        label: String(s.index),
        cumulativeRevenueCents: s.cumulativeRevenueCents,
        roi: s.roi,
        step: s,
      })),
    ],
    [steps],
  );

  const geo = useMemo(() => {
    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const maxValue = Math.max(
      investmentCents * 1.15,
      ...points.map((p) => p.cumulativeRevenueCents),
    );
    const ticks = niceTicks(maxValue);
    const top = ticks[ticks.length - 1];
    const n = points.length;
    const x = (i: number) => PAD.left + (n === 1 ? 0 : (i / (n - 1)) * plotW);
    const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
    // Escalera: horizontal hasta la siguiente venta y luego sube.
    let d = `M${x(0).toFixed(1)},${y(points[0].cumulativeRevenueCents).toFixed(1)}`;
    for (let i = 1; i < n; i++) {
      d += ` H${x(i).toFixed(1)} V${y(points[i].cumulativeRevenueCents).toFixed(1)}`;
    }
    return { plotW, plotH, ticks, x, y, revenuePath: d };
  }, [points, width, investmentCents]);

  const { plotW, plotH, ticks, x, y, revenuePath } = geo;
  const last = points.length - 1;
  const lastY = y(points[last].cumulativeRevenueCents);
  const invY = y(investmentCents);
  const labelsCollide = Math.abs(lastY - invY) < 16;
  const labelEvery = Math.ceil(points.length / Math.max(1, Math.floor(plotW / 44)));

  const handlePointer = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = clientX - rect.left;
    let nearest = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(nearest) - px)) nearest = i;
    });
    setHover(nearest);
  };

  const hovered = hover != null ? points[hover] : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-2 text-xs text-gray-600">
            <span className="inline-block w-4 h-0.5 rounded-full" style={{ background: REVENUE_COLOR }} />
            Ingresos acumulados
          </span>
          <span className="flex items-center gap-2 text-xs text-gray-600">
            <span className="inline-block w-4 h-0.5 rounded-full" style={{ background: INVESTMENT_COLOR }} />
            Inversión ({formatPen(investmentCents)})
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-xs font-semibold text-[#057f78] hover:underline"
        >
          {showTable ? "Ver gráfico" : "Ver tabla de ventas"}
        </button>
      </div>

      {showTable ? (
        steps.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">Todavía no hay ventas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-2 pr-3 font-semibold">Venta</th>
                  <th className="py-2 pr-3 font-semibold">Fecha</th>
                  <th className="py-2 pr-3 font-semibold">Concepto</th>
                  <th className="py-2 pr-3 font-semibold text-right">Ingreso</th>
                  <th className="py-2 pr-3 font-semibold text-right">Acumulado</th>
                  <th className="py-2 font-semibold text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 tabular-nums">
                {steps.map((s) => (
                  <tr key={s.code}>
                    <td className="py-2 pr-3 text-gray-700">#{s.index}</td>
                    <td className="py-2 pr-3 text-gray-500 text-xs">{formatDateTime(s.at)}</td>
                    <td className="py-2 pr-3 text-gray-700">{s.description}</td>
                    <td className="py-2 pr-3 text-right text-gray-700">+{formatPen(s.incomeCents)}</td>
                    <td className="py-2 pr-3 text-right text-gray-700">{formatPen(s.cumulativeRevenueCents)}</td>
                    <td className="py-2 text-right font-semibold text-gray-800">{formatRoiPct(s.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div
          ref={containerRef}
          className="relative select-none"
          onPointerMove={(e) => handlePointer(e.clientX)}
          onPointerLeave={() => setHover(null)}
        >
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label="Ingresos acumulados por venta contra la inversión fija"
            className="block max-w-full"
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} stroke="#eef0f3" strokeWidth={1} />
                <text
                  x={PAD.left - 10}
                  y={y(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-gray-400 text-[11px] tabular-nums"
                >
                  {compactPen(t)}
                </text>
              </g>
            ))}

            {/* Eje X: Inicio, 1, 2, … (número de venta) */}
            {points.map((p, i) =>
              i % labelEvery === 0 || i === last ? (
                <text
                  key={p.label}
                  x={x(i)}
                  y={PAD.top + plotH + 20}
                  textAnchor="middle"
                  className="fill-gray-400 text-[11px]"
                >
                  {p.label}
                </text>
              ) : null,
            )}
            <text
              x={PAD.left + plotW}
              y={PAD.top + plotH + 32}
              textAnchor="end"
              className="fill-gray-400 text-[10px]"
            >
              N.º de venta
            </text>

            {/* Venta con la que se recupera la inversión */}
            {breakEvenSale != null && (
              <g>
                <line
                  x1={x(breakEvenSale)}
                  x2={x(breakEvenSale)}
                  y1={PAD.top}
                  y2={PAD.top + plotH}
                  stroke="#b8bcc4"
                  strokeWidth={1}
                />
                <text x={x(breakEvenSale) + 6} y={PAD.top + 10} className="fill-gray-500 text-[11px] font-semibold">
                  Recuperación
                </text>
              </g>
            )}

            {/* Inversión fija */}
            <line
              x1={PAD.left}
              x2={PAD.left + plotW}
              y1={invY}
              y2={invY}
              stroke={INVESTMENT_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* Ingresos acumulados (escalera) */}
            <path
              d={revenuePath}
              fill="none"
              stroke={REVENUE_COLOR}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {hover != null && (
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="#9ca3af" strokeWidth={1} />
            )}

            {[last, ...(hover != null && hover !== last ? [hover] : [])].map((i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(points[i].cumulativeRevenueCents)}
                r={4}
                fill={REVENUE_COLOR}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}

            {/* Etiquetas finales (en tinta, no en el color de la serie) */}
            <text
              x={PAD.left + plotW + 10}
              y={labelsCollide ? invY - 9 : invY}
              dominantBaseline="middle"
              className="fill-gray-700 text-[12px] font-semibold tabular-nums"
            >
              {formatPen(investmentCents)}
            </text>
            <text
              x={PAD.left + plotW + 10}
              y={labelsCollide ? invY + 9 : lastY}
              dominantBaseline="middle"
              className="fill-gray-700 text-[12px] font-semibold tabular-nums"
            >
              {formatPen(points[last].cumulativeRevenueCents)}
            </text>
          </svg>

          {hovered && hover != null && (
            <div
              className="pointer-events-none absolute top-2 z-10 rounded-xl border border-gray-100 bg-white/95 px-3 py-2 shadow-lg text-xs"
              style={{ left: Math.min(Math.max(x(hover) - 100, 0), width - 210), width: 200 }}
            >
              <p className="font-semibold text-gray-500 mb-1.5">
                {hovered.step ? `Venta #${hovered.step.index}` : "Inicio (sin ventas)"}
              </p>
              {hovered.step && (
                <p className="text-gray-500 mb-1 truncate">
                  {hovered.step.description} ·{" "}
                  <span className="font-bold text-gray-900">+{formatPen(hovered.step.incomeCents)}</span>
                </p>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <span className="inline-block w-3 h-0.5 rounded-full" style={{ background: REVENUE_COLOR }} />
                  Acumulado
                </span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatPen(hovered.cumulativeRevenueCents)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1 pt-1 border-t border-gray-100">
                <span className="text-gray-500">ROI</span>
                <span className="font-bold text-gray-900 tabular-nums">{formatRoiPct(hovered.roi)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
