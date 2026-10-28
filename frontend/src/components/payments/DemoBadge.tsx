import { FlaskConical } from "lucide-react";

interface DemoBadgeProps {
  /** Muestra "· sin cargo real" junto a la etiqueta. */
  detail?: boolean;
  className?: string;
}

/**
 * Identifica los pagos de la pasarela de tarjeta, que es una simulación
 * (modo TEST): discreta pero siempre visible. No retirarla — ver CLAUDE.md §0.2.
 */
export default function DemoBadge({ detail = true, className = "" }: DemoBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500 whitespace-nowrap ${className}`}
      title="Pago en modo demo: no se realizó ningún cargo real"
    >
      <FlaskConical className="w-3 h-3" />
      Modo demo{detail && " · sin cargo real"}
    </span>
  );
}
