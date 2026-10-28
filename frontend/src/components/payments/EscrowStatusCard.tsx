"use client";

import Link from "next/link";
import { CheckCircle2, Clock, RotateCcw, ShieldCheck } from "lucide-react";
import DemoBadge from "@/src/components/payments/DemoBadge";
import { formatPen, type PaymentDto } from "@/src/lib/payment";

interface EscrowStatusCardProps {
  payment: PaymentDto;
  viewer: "creator" | "applicant";
}

/** Estado del pago en garantía de una asesoría, explicado para cada parte. */
export default function EscrowStatusCard({ payment, viewer }: EscrowStatusCardProps) {
  const amount = formatPen(payment.amountCents);
  const other = viewer === "creator" ? payment.payee?.name ?? "el ayudante" : payment.payer.name;

  const content = (() => {
    switch (payment.status) {
      case "PENDING":
        return {
          icon: Clock,
          tone: "border-amber-200 bg-amber-50 text-amber-800",
          title: "Pago pendiente",
          body:
            viewer === "creator"
              ? `Tu pago de ${amount} está pendiente. ${other} quedará aceptado al confirmarse.`
              : `El pago de ${amount} del solicitante está pendiente de confirmación.`,
        };
      case "HELD":
        return {
          icon: ShieldCheck,
          tone: "border-[#1a4ca3]/20 bg-[#eff4ff] text-[#143d87]",
          title: `${amount} en garantía`,
          body:
            viewer === "creator"
              ? `Tu pago está retenido. Se libera a ${other} cuando ambos se califiquen.`
              : "El pago ya está asegurado. Lo recibes cuando ambos se califiquen al terminar.",
        };
      case "RELEASED":
        return {
          icon: CheckCircle2,
          tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
          title: "Pago liberado",
          body:
            viewer === "creator"
              ? `Ambos se calificaron: ${other} recibió su pago.`
              : `Recibiste ${formatPen(payment.payoutCents)}${
                  payment.commissionCents > 0
                    ? ` (comisión ${formatPen(payment.commissionCents)})`
                    : ""
                }.`,
        };
      case "REFUNDED":
        return {
          icon: RotateCcw,
          tone: "border-gray-200 bg-gray-50 text-gray-700",
          title: "Pago reembolsado",
          body: `Un administrador devolvió ${amount} al solicitante.`,
        };
      default:
        return null;
    }
  })();

  if (!content) return null;
  const Icon = content.icon;

  return (
    <div className={`rounded-xl border px-4 py-3 ${content.tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{content.title}</p>
          <p className="text-xs mt-0.5 opacity-90">{content.body}</p>
          <div className="flex items-center gap-3 mt-2">
            <Link href={`/pagos/${payment.id}`} className="text-xs font-semibold underline">
              Ver recibo
            </Link>
            {payment.mode === "TEST" && <DemoBadge detail={false} />}
          </div>
        </div>
      </div>
    </div>
  );
}
