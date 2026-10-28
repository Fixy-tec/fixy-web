"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, Crown, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import CardPaymentForm from "@/src/components/payments/CardPaymentForm";
import {
  fetchPaymentConfig,
  formatPen,
  payPlanWithCard,
  type BillingPeriod,
  type CardPayload,
  type PaymentConfigDto,
} from "@/src/lib/payment";

const PRO_PERKS = [
  "Solicitudes y postulaciones ilimitadas",
  "Tus solicitudes destacadas en el feed",
  "Insignia Pro en perfil y ranking",
  "0% de comisión en tus asesorías",
  "Estadísticas de tu actividad",
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, refreshSession } = useAuth();
  const [config, setConfig] = useState<PaymentConfigDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>(
    searchParams.get("period") === "MONTHLY" ? "MONTHLY" : "YEARLY",
  );

  useEffect(() => {
    fetchPaymentConfig()
      .then(setConfig)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No se pudo cargar el checkout"),
      );
  }, []);

  if (error) {
    return <p className="text-center text-sm text-rose-600 py-20">{error}</p>;
  }
  if (!config || !token) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  const amountCents = period === "YEARLY" ? config.proYearlyCents : config.proMonthlyCents;
  const periodLabel = period === "YEARLY" ? "anual" : "mensual";

  const handleCardPay = async (card: CardPayload) => {
    const payment = await payPlanWithCard(token, period, card);
    await refreshSession();
    router.push(`/pagos/${payment.id}?nuevo=1`);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href="/planes"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a planes
        </Link>

        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
          {/* Resumen */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Resumen del pedido
            </p>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800">Helpy Pro {periodLabel}</p>
                <p className="text-xs text-gray-500">
                  {user?.isPro
                    ? "Renovación: el tiempo se suma a tu plan actual"
                    : "Se activa al instante con tarjeta"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {(["MONTHLY", "YEARLY"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`text-left rounded-xl border-2 px-4 py-3 transition-all ${
                    period === p
                      ? "border-[#1a4ca3] bg-[#eff4ff]"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-500">
                    {p === "MONTHLY" ? "Mensual" : "Anual"}
                  </p>
                  <p className="font-bold text-gray-800">
                    {formatPen(p === "YEARLY" ? config.proYearlyCents : config.proMonthlyCents)}
                  </p>
                </button>
              ))}
            </div>

            <ul className="space-y-2.5 mb-6">
              {PRO_PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-[#057f78] shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatPen(amountCents)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPen(amountCents)}</span>
              </div>
            </div>
          </div>

          {/* Pago */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              <Lock className="w-3.5 h-3.5" />
              Pago seguro
            </p>
            <CardPaymentForm
              amountCents={amountCents}
              submitLabel={`Pagar ${formatPen(amountCents)}`}
              onSubmit={handleCardPay}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutView() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
