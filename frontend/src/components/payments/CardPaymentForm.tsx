"use client";

import { useMemo, useState } from "react";
import { CreditCard, Loader2, Lock } from "lucide-react";
import DemoBadge from "@/src/components/payments/DemoBadge";
import {
  detectCardBrand,
  formatCardNumber,
  formatPen,
  luhnValid,
  TEST_CARDS,
  type CardPayload,
} from "@/src/lib/payment";

interface CardPaymentFormProps {
  amountCents: number;
  submitLabel?: string;
  onSubmit: (card: CardPayload) => Promise<void>;
}

const BRAND_LABEL: Record<string, string> = {
  VISA: "VISA",
  MASTERCARD: "Mastercard",
  AMEX: "AMEX",
  DINERS: "Diners",
};

/** La pasarela "procesa" unos instantes antes de responder, como una real. */
const MIN_PROCESSING_MS = 1200;

export default function CardPaymentForm({
  amountCents,
  submitLabel,
  onSubmit,
}: CardPaymentFormProps) {
  const [digits, setDigits] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const brand = detectCardBrand(digits);
  const maxDigits = brand === "AMEX" ? 15 : brand === "DINERS" ? 14 : 16;
  const cvvLength = brand === "AMEX" ? 4 : 3;

  const numberError = useMemo(() => {
    if (digits.length < 13) return null;
    if (!brand) return "Solo Visa, Mastercard, Amex o Diners";
    if (digits.length >= maxDigits && !luhnValid(digits)) return "Número inválido";
    return null;
  }, [digits, brand, maxDigits]);

  const handleExpiry = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 4);
    setExpiry(clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean);
  };

  const validate = (): CardPayload | string => {
    if (!brand || digits.length < 13 || !luhnValid(digits)) {
      return "Revisa el número de la tarjeta";
    }
    if (holder.trim().length < 3) return "Ingresa el nombre del titular";
    const [mm, yy] = expiry.split("/");
    const month = Number(mm);
    const year = 2000 + Number(yy);
    if (!mm || !yy || yy.length !== 2 || month < 1 || month > 12) {
      return "Fecha de vencimiento inválida (MM/AA)";
    }
    if (new Date(year, month, 1).getTime() <= Date.now()) return "La tarjeta está vencida";
    if (cvv.length !== cvvLength) return `El CVV debe tener ${cvvLength} dígitos`;
    return { number: digits, holder: holder.trim(), expMonth: month, expYear: year, cvv };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = validate();
    if (typeof result === "string") {
      setError(result);
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, MIN_PROCESSING_MS));
    try {
      await onSubmit(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  const fillTestCard = (number: string) => {
    setDigits(number.replace(/\s/g, ""));
    if (!holder) setHolder("Estudiante Prueba");
    if (!expiry) setExpiry("12/30");
    if (!cvv) setCvv("123");
    setError(null);
  };

  const previewNumber = formatCardNumber(
    digits.padEnd(maxDigits, "•").slice(0, maxDigits),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Vista previa de la tarjeta */}
      <div className="relative h-44 rounded-2xl p-5 text-white shadow-lg overflow-hidden bg-gradient-to-br from-[#1a4ca3] via-[#1d5bc4] to-[#057f78]">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-0 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between">
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" />
          <span className="text-sm font-bold tracking-wide">
            {brand ? BRAND_LABEL[brand] : <CreditCard className="w-6 h-6 opacity-80" />}
          </span>
        </div>
        <p className="relative mt-6 font-mono text-lg tracking-widest">{previewNumber}</p>
        <div className="relative mt-4 flex items-end justify-between text-xs uppercase">
          <div className="min-w-0">
            <p className="text-white/60 text-[10px]">Titular</p>
            <p className="font-semibold truncate max-w-[200px]">
              {holder.trim() || "NOMBRE APELLIDO"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-[10px]">Vence</p>
            <p className="font-semibold">{expiry || "MM/AA"}</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Número de tarjeta
        </label>
        <input
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={formatCardNumber(digits)}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, maxDigits))}
          disabled={processing}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 ${
            numberError ? "border-rose-300" : "border-gray-200"
          }`}
        />
        {numberError && <p className="text-xs text-rose-600 mt-1">{numberError}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Nombre del titular
        </label>
        <input
          autoComplete="cc-name"
          placeholder="Como aparece en la tarjeta"
          value={holder}
          onChange={(e) => setHolder(e.target.value.slice(0, 60))}
          disabled={processing}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Vencimiento
          </label>
          <input
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={expiry}
            onChange={(e) => handleExpiry(e.target.value)}
            disabled={processing}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">CVV</label>
          <input
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={brand === "AMEX" ? "1234" : "123"}
            type="password"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, cvvLength))}
            disabled={processing}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={processing}
        className="w-full flex items-center justify-center gap-2 bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-70"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando pago…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            {submitLabel ?? `Pagar ${formatPen(amountCents)}`}
          </>
        )}
      </button>

      {/* La pasarela no cobra dinero real: la etiqueta queda siempre visible */}
      <div className="flex justify-center">
        <DemoBadge />
      </div>

      <details className="group rounded-xl border border-gray-100 px-3 py-2">
        <summary className="cursor-pointer list-none text-xs font-medium text-gray-500 hover:text-gray-700">
          Tarjetas de demostración
        </summary>
        <div className="mt-2 grid gap-1">
          {TEST_CARDS.map((t) => (
            <button
              key={t.number}
              type="button"
              onClick={() => fillTestCard(t.number)}
              disabled={processing}
              className="flex items-center justify-between gap-2 text-left text-[11px] text-gray-600 hover:bg-gray-50 rounded-lg px-2 py-1"
            >
              <span className="font-mono">{t.number}</span>
              <span className="text-gray-400">{t.result}</span>
            </button>
          ))}
        </div>
      </details>
    </form>
  );
}
