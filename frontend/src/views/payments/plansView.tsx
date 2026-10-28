"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import {
  fetchPaymentConfig,
  formatPen,
  type BillingPeriod,
  type PaymentConfigDto,
} from "@/src/lib/payment";

interface Feature {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

function buildFeatures(config: PaymentConfigDto): Feature[] {
  return [
    {
      label: "Solicitudes activas a la vez",
      free: `Hasta ${config.freeLimits.activeRequests}`,
      pro: "Ilimitadas",
    },
    {
      label: "Postulaciones por semana",
      free: `Hasta ${config.freeLimits.applicationsPerWeek}`,
      pro: "Ilimitadas",
    },
    { label: "Tus solicitudes destacadas al inicio del feed", free: false, pro: true },
    { label: "Insignia Pro en tu perfil y en el ranking", free: false, pro: true },
    {
      label: "Comisión al cobrar asesorías",
      free: `${config.freeCommissionPct}%`,
      pro: "0%",
    },
    {
      label: "Estadísticas: visitas al perfil, tasa de aceptación y ganancias",
      free: false,
      pro: true,
    },
    { label: "Pago en garantía en asesorías", free: true, pro: true },
  ];
}

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-4 h-4 text-[#057f78]" />;
  if (value === false) return <X className="w-4 h-4 text-gray-300" />;
  return <span className="text-sm font-semibold text-gray-700">{value}</span>;
}

export default function PlansView() {
  const { user, isAuthenticated } = useAuth();
  const [config, setConfig] = useState<PaymentConfigDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>("YEARLY");

  useEffect(() => {
    fetchPaymentConfig()
      .then(setConfig)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No se pudieron cargar los planes"),
      );
  }, []);

  if (error) {
    return <p className="text-center text-sm text-rose-600 py-20">{error}</p>;
  }
  if (!config) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  const features = buildFeatures(config);
  const yearlyAsMonthly = config.proMonthlyCents * 12;
  const savingPct = Math.max(
    0,
    Math.round((1 - config.proYearlyCents / yearlyAsMonthly) * 100),
  );
  const price = period === "YEARLY" ? config.proYearlyCents : config.proMonthlyCents;
  const isPro = !!user?.isPro;
  const checkoutHref = `/checkout?period=${period}`;

  return (
    <div className="bg-gradient-to-b from-[#eff4ff] to-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a4ca3] bg-white border border-[#1a4ca3]/15 rounded-full px-3 py-1 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Planes
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Ayuda más, crece más rápido
          </h1>
          <p className="text-gray-500">
            Empieza gratis. Pásate a Pro cuando quieras publicar y postular sin
            límites, destacar tus solicitudes y cobrar tus asesorías sin comisión.
          </p>
        </div>

        {/* Mensual / anual */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 rounded-xl bg-white border border-gray-200 shadow-sm">
            {(["MONTHLY", "YEARLY"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  period === p ? "bg-[#1a4ca3] text-white shadow" : "text-gray-500"
                }`}
              >
                {p === "MONTHLY" ? "Mensual" : "Anual"}
                {p === "YEARLY" && savingPct > 0 && (
                  <span
                    className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                      period === p ? "bg-white/20" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    −{savingPct}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <div className="bg-white rounded-3xl border border-gray-200 p-7 flex flex-col">
            <h2 className="text-lg font-bold text-gray-800">Free</h2>
            <p className="text-sm text-gray-500 mb-5">Para empezar a ayudar y pedir ayuda.</p>
            <p className="text-4xl font-bold text-gray-900 mb-6">
              S/ 0<span className="text-base font-medium text-gray-400"> /siempre</span>
            </p>
            <ul className="space-y-3 flex-1">
              {features.map((f) => (
                <li key={f.label} className="flex items-center justify-between gap-3 text-sm text-gray-600">
                  <span>{f.label}</span>
                  <FeatureValue value={f.free} />
                </li>
              ))}
            </ul>
            <div className="mt-7">
              {isAuthenticated ? (
                <p className="text-center text-sm font-medium text-gray-400 py-3">
                  {isPro ? "Incluido en tu plan" : "Tu plan actual"}
                </p>
              ) : (
                <Link
                  href="/auth/register"
                  className="block text-center py-3 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Crear cuenta gratis
                </Link>
              )}
            </div>
          </div>

          {/* Pro */}
          <div className="relative bg-white rounded-3xl border-2 border-[#1a4ca3] p-7 flex flex-col shadow-xl shadow-[#1a4ca3]/10">
            <span className="absolute -top-3 left-7 inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-amber-400 to-orange-500 rounded-full px-3 py-1">
              <Crown className="w-3.5 h-3.5" />
              Recomendado
            </span>
            <h2 className="text-lg font-bold text-gray-800">Pro</h2>
            <p className="text-sm text-gray-500 mb-5">Para quienes ayudan en serio.</p>
            <p className="text-4xl font-bold text-gray-900">
              {formatPen(price)}
              <span className="text-base font-medium text-gray-400">
                {period === "YEARLY" ? " /año" : " /mes"}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-6 h-4">
              {period === "YEARLY" &&
                `Equivale a ${formatPen(Math.round(config.proYearlyCents / 12))} al mes`}
            </p>
            <ul className="space-y-3 flex-1">
              {features.map((f) => (
                <li key={f.label} className="flex items-center justify-between gap-3 text-sm text-gray-700">
                  <span>{f.label}</span>
                  <FeatureValue value={f.pro} />
                </li>
              ))}
            </ul>
            <div className="mt-7">
              {isPro ? (
                <Link
                  href="/pagos"
                  className="block text-center py-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold"
                >
                  Ya eres Pro · Ver mi plan
                </Link>
              ) : isAuthenticated ? (
                <Link
                  href={checkoutHref}
                  className="block text-center py-3 rounded-xl bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold transition-colors"
                >
                  Mejorar a Pro
                </Link>
              ) : (
                <Link
                  href="/auth/register"
                  className="block text-center py-3 rounded-xl bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold transition-colors"
                >
                  Crear cuenta y pasarme a Pro
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-14 grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="flex items-center gap-2 font-semibold text-gray-800 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-[#057f78]" />
              Asesorías con pago en garantía
            </p>
            <p className="text-sm text-gray-500">
              Cuando aceptas a alguien en una asesoría pagada, el dinero queda
              retenido en Helpy y se libera solo cuando ambos se califican.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="flex items-center gap-2 font-semibold text-gray-800 mb-1.5">
              <Sparkles className="w-4 h-4 text-[#1a4ca3]" />
              Sin renovación automática
            </p>
            <p className="text-sm text-gray-500">
              Pagas una vez por el periodo que elijas. Si renuevas antes de que
              venza, el tiempo se suma al que te queda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
