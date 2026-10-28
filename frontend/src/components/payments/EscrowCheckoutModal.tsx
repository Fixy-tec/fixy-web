"use client";

import { ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import CardPaymentForm from "@/src/components/payments/CardPaymentForm";
import {
  formatPen,
  payEscrowWithCard,
  type CardPayload,
  type PaymentDto,
} from "@/src/lib/payment";

interface EscrowCheckoutModalProps {
  applicationId: string;
  applicantName: string;
  requestTitle: string;
  amountCents: number;
  onClose: () => void;
  onPaid: (payment: PaymentDto) => void | Promise<void>;
}

/**
 * Pago de una asesoría: el dinero queda retenido en garantía y el postulante
 * queda aceptado. Se libera al ayudante cuando ambos se califican.
 */
export default function EscrowCheckoutModal({
  applicationId,
  applicantName,
  requestTitle,
  amountCents,
  onClose,
  onPaid,
}: EscrowCheckoutModalProps) {
  const { token } = useAuth();

  const handleCard = async (card: CardPayload) => {
    if (!token) throw new Error("Debes iniciar sesión");
    const payment = await payEscrowWithCard(token, applicationId, card);
    await onPaid(payment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-full overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Pagar y aceptar</h3>
            <p className="text-sm text-gray-500">
              {applicantName} · {requestTitle}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 rounded-xl border border-[#1a4ca3]/15 bg-[#eff4ff] p-3 mb-5">
          <ShieldCheck className="w-5 h-5 text-[#1a4ca3] shrink-0 mt-0.5" />
          <p className="text-xs text-[#143d87] leading-relaxed">
            <span className="font-semibold">{formatPen(amountCents)} quedan en garantía.</span>{" "}
            {applicantName} los recibe cuando ambos se califiquen al terminar la
            asesoría. Si algo sale mal, un administrador puede devolvértelos.
          </p>
        </div>

        <CardPaymentForm
          amountCents={amountCents}
          submitLabel={`Pagar ${formatPen(amountCents)} y aceptar`}
          onSubmit={handleCard}
        />
      </div>
    </div>
  );
}
