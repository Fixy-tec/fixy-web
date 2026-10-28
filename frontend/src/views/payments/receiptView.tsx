"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
  Printer,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import DemoBadge from "@/src/components/payments/DemoBadge";
import {
  fetchPayment,
  formatDateTime,
  formatPen,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_STYLE,
  paymentMethodLabel,
  type PaymentDto,
} from "@/src/lib/payment";

function StatusHero({
  payment,
  isNew,
}: {
  payment: PaymentDto;
  isNew: boolean;
}) {
  if (payment.status === "PENDING") {
    return (
      <div className="text-center">
        <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-800">Pago pendiente</h1>
        <p className="text-sm text-gray-500 mt-1">
          Te avisaremos con una notificación cuando se confirme.
        </p>
      </div>
    );
  }
  if (payment.status === "REJECTED") {
    return (
      <div className="text-center">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-800">Pago no aprobado</h1>
        {payment.declineReason && (
          <p className="text-sm text-gray-500 mt-1">{payment.declineReason}</p>
        )}
      </div>
    );
  }
  if (payment.status === "HELD") {
    return (
      <div className="text-center">
        <ShieldCheck className="w-12 h-12 text-[#1a4ca3] mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-800">
          Pago retenido en garantía
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Se libera al ayudante cuando ambos se califiquen.
        </p>
      </div>
    );
  }
  const title =
    payment.purpose === "PLAN_SUBSCRIPTION"
      ? isNew
        ? "¡Bienvenido a Helpy Pro!"
        : "Pago aprobado"
      : payment.status === "REFUNDED"
        ? "Pago reembolsado"
        : "Pago liberado";
  return (
    <div className="text-center">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      {payment.purpose === "PLAN_SUBSCRIPTION" && isNew && (
        <p className="text-sm text-gray-500 mt-1">
          Ya tienes todos los beneficios Pro activos.
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}

function ReceiptContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();
  const [payment, setPayment] = useState<PaymentDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    fetchPayment(token, id)
      .then(setPayment)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No se pudo cargar el pago"),
      );
  }, [token, id]);

  if (error) {
    return <p className="text-center text-sm text-rose-600 py-20">{error}</p>;
  }
  if (!payment) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  const isEscrow = payment.purpose === "ASESORIA_ESCROW";
  const viewerIsPayee = payment.payee?.id === user?.id;

  return (
    <div className="min-h-screen bg-[#f6f8fb] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            href="/pagos"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
            Mis pagos
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <StatusHero
            payment={payment}
            isNew={searchParams.get("nuevo") === "1"}
          />

          {payment.mode === "TEST" && (
            <div className="mt-4 flex justify-center">
              {/* <DemoBadge /> */}
              <div> </div>
            </div>
          )}

          <div className="mt-6 border-t border-dashed border-gray-200 pt-4 divide-y divide-gray-50">
            <Row
              label="Código"
              value={<span className="font-mono">{payment.code}</span>}
            />
            <Row label="Fecha" value={formatDateTime(payment.createdAt)} />
            <Row
              label="Concepto"
              value={
                payment.request ? (
                  <Link
                    href={`/applications/${payment.request.id}`}
                    className="text-[#1a4ca3] hover:underline"
                  >
                    {payment.description}
                  </Link>
                ) : (
                  payment.description
                )
              }
            />
            <Row label="Método" value={paymentMethodLabel(payment)} />
            {isEscrow && <Row label="Pagó" value={payment.payer.name} />}
            {isEscrow && payment.payee && (
              <Row label="Ayudante" value={payment.payee.name} />
            )}
            <Row
              label="Estado"
              value={
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${PAYMENT_STATUS_STYLE[payment.status]}`}
                >
                  {PAYMENT_STATUS_LABEL[payment.status]}
                </span>
              }
            />
          </div>

          <div className="mt-4 rounded-2xl bg-gray-50 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total pagado</span>
              <span>{formatPen(payment.amountCents)}</span>
            </div>
            {isEscrow && payment.status === "RELEASED" && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Comisión Helpy</span>
                  <span>− {formatPen(payment.commissionCents)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#057f78]">
                  <span>
                    {viewerIsPayee ? "Recibiste" : "Recibió el ayudante"}
                  </span>
                  <span>{formatPen(payment.payoutCents)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptView() {
  return (
    <Suspense fallback={null}>
      <ReceiptContent />
    </Suspense>
  );
}
