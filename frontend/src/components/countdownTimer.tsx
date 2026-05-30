"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  /** ISO string del deadline. Si es null, se renderiza un placeholder discreto. */
  deadline: string | null;
  /** ISO string de inicio (createdAt). Si se pasa, también se muestra el tiempo transcurrido. */
  startedAt?: string;
  /** Mostrar el bloque de "tiempo transcurrido". */
  showElapsed?: boolean;
  /** Tamaño visual */
  size?: "sm" | "md";
}

interface Breakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function breakdownMs(ms: number): Breakdown {
  const safeMs = Math.max(0, ms);
  const days = Math.floor(safeMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((safeMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((safeMs / (1000 * 60)) % 60);
  const seconds = Math.floor((safeMs / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatBreakdown(b: Breakdown, includeDays = true): string {
  if (includeDays) {
    return `${b.days}d ${pad(b.hours)}h ${pad(b.minutes)}m ${pad(b.seconds)}s`;
  }
  return `${pad(b.hours)}h ${pad(b.minutes)}m ${pad(b.seconds)}s`;
}

/**
 * Cronómetro de cuenta regresiva hacia un deadline.
 *
 * Actualiza cada segundo, muestra el tiempo restante en formato d/h/m/s.
 * Cambia de color cuando queda poco tiempo (< 24h amarillo, < 1h rojo, vencido gris).
 * Opcionalmente muestra también el tiempo transcurrido desde `startedAt`.
 */
export default function CountdownTimer({
  deadline,
  startedAt,
  showElapsed = true,
  size = "md",
}: Props) {
  const deadlineMs = useMemo(
    () => (deadline ? new Date(deadline).getTime() : null),
    [deadline],
  );
  const startedMs = useMemo(
    () => (startedAt ? new Date(startedAt).getTime() : null),
    [startedAt],
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (deadlineMs == null) {
    return (
      <div className="text-xs text-gray-400 italic">
        Sin fecha límite definida
      </div>
    );
  }

  const remainingMs = deadlineMs - now;
  const elapsedMs = startedMs != null ? now - startedMs : null;
  const isExpired = remainingMs <= 0;

  const remaining = breakdownMs(remainingMs);
  const elapsed = elapsedMs != null ? breakdownMs(elapsedMs) : null;

  // Color del bloque de "restante"
  let accent = "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (isExpired) {
    accent = "text-gray-500 bg-gray-50 border-gray-100";
  } else if (remainingMs < 60 * 60 * 1000) {
    accent = "text-rose-600 bg-rose-50 border-rose-100";
  } else if (remainingMs < 24 * 60 * 60 * 1000) {
    accent = "text-amber-700 bg-amber-50 border-amber-100";
  }

  const labelSize = size === "sm" ? "text-[10px]" : "text-xs";
  const valueSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="space-y-2">
      <div className={`rounded-xl border px-4 py-3 ${accent}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <Clock size={size === "sm" ? 12 : 13} strokeWidth={2} />
          <span className={`${labelSize} font-semibold uppercase tracking-wide`}>
            {isExpired ? "Tiempo agotado" : "Tiempo restante"}
          </span>
        </div>
        <p className={`${valueSize} font-mono font-semibold tabular-nums`}>
          {isExpired ? "00d 00h 00m 00s" : formatBreakdown(remaining)}
        </p>
      </div>

      {showElapsed && elapsed && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-gray-500">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={size === "sm" ? 12 : 13} strokeWidth={2} />
            <span className={`${labelSize} font-semibold uppercase tracking-wide`}>
              Tiempo transcurrido
            </span>
          </div>
          <p className={`${valueSize} font-mono font-semibold tabular-nums text-gray-700`}>
            {formatBreakdown(elapsed)}
          </p>
        </div>
      )}
    </div>
  );
}
