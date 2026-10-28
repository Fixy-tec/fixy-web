"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Crown,
  FlaskConical,
  Loader2,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Unlock,
  X,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useAdmin } from "@/src/context/AdminContext";
import DemoBadge from "@/src/components/payments/DemoBadge";
import { useToast } from "@/src/context/ToastContext";
import {
  getAdminPayments,
  getAdminPaymentsSummary,
  getPaymentSettings,
  runAdminPaymentAction,
  updatePaymentSettings,
  type AdminPaymentAction,
  type AdminPaymentsSummaryDto,
  type ListPaymentsParams,
  type PaymentSettingsDto,
} from "@/src/lib/admin";
import {
  formatDateTime,
  formatPen,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_STYLE,
  paymentMethodLabel,
  type PaymentDto,
} from "@/src/lib/payment";

const ACTION_COPY: Record<
  AdminPaymentAction,
  { title: string; body: string; confirm: string; success: string }
> = {
  release: {
    title: "¿Liberar el pago al ayudante?",
    body: "Úsalo si una de las partes no calificó. Se descuenta la comisión según el plan del ayudante.",
    confirm: "Liberar pago",
    success: "Pago liberado",
  },
  refund: {
    title: "¿Reembolsar al pagador?",
    body: "La garantía se devuelve al solicitante y la asesoría queda sin pago.",
    confirm: "Reembolsar",
    success: "Pago reembolsado",
  },
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "test" | "warn";
}) {
  const tones = {
    default: "bg-white border-gray-100",
    test: "bg-amber-50/60 border-amber-100",
    warn: "bg-white border-amber-200",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <Icon
        className={`w-4 h-4 mb-2 ${tone === "test" ? "text-amber-600" : "text-[#057f78]"}`}
      />
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function PaymentActions({
  payment,
  onAction,
}: {
  payment: PaymentDto;
  onAction: (payment: PaymentDto, action: AdminPaymentAction) => void;
}) {
  const btn =
    "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg";
  if (payment.status === "HELD") {
    return (
      <div className="flex gap-1.5 justify-end">
        <button
          type="button"
          onClick={() => onAction(payment, "release")}
          className={`${btn} bg-[#eff4ff] text-[#1a4ca3] hover:bg-[#e0eaff]`}
        >
          <Unlock className="w-3.5 h-3.5" /> Liberar
        </button>
        <button
          type="button"
          onClick={() => onAction(payment, "refund")}
          className={`${btn} bg-gray-100 text-gray-600 hover:bg-gray-200`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reembolsar
        </button>
      </div>
    );
  }
  return <span className="block text-right text-xs text-gray-300">—</span>;
}

// ── Configuración ──────────────────────────────────────────────────────────

function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}

function SettingsModal({
  token,
  onClose,
  onSaved,
}: {
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<PaymentSettingsDto | null>(null);
  const [form, setForm] = useState({
    proMonthly: "",
    proYearly: "",
    commissionPct: "",
    payoutBank: "",
    payoutHolder: "",
    payoutAccount: "",
    payoutCci: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPaymentSettings(token)
      .then((s) => {
        setSettings(s);
        setForm({
          proMonthly: centsToInput(s.proMonthlyCents),
          proYearly: centsToInput(s.proYearlyCents),
          commissionPct: String(s.freeCommissionBps / 100),
          payoutBank: s.payoutBank ?? "",
          payoutHolder: s.payoutHolder ?? "",
          payoutAccount: s.payoutAccount ?? "",
          payoutCci: s.payoutCci ?? "",
        });
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Error"),
      );
  }, [token]);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setError(null);
    const monthly = Math.round(Number(form.proMonthly) * 100);
    const yearly = Math.round(Number(form.proYearly) * 100);
    const commission = Math.round(Number(form.commissionPct) * 100);
    if (![monthly, yearly, commission].every(Number.isFinite)) {
      setError("Revisa los montos: usa números (ej. 9.90)");
      return;
    }
    setSaving(true);
    try {
      await updatePaymentSettings(token, {
        proMonthlyCents: monthly,
        proYearlyCents: yearly,
        freeCommissionBps: commission,
        payoutBank: form.payoutBank.trim(),
        payoutHolder: form.payoutHolder.trim(),
        // Se aceptan números con espacios (p. ej. una tarjeta "4704 5800 …").
        payoutAccount: form.payoutAccount.replace(/\s+/g, ""),
        payoutCci: form.payoutCci.trim(),
      });
      showToast("Configuración guardada", "success");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const input =
    "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#057f78]/30";
  const label = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-full overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">
            Configuración de pagos
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!settings ? (
          <div className="flex justify-center py-10">
            {error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-[#057f78]" />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Precios y comisión
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className={label}>Pro mensual (S/)</label>
                  <input
                    className={input}
                    inputMode="decimal"
                    value={form.proMonthly}
                    onChange={set("proMonthly")}
                  />
                </div>
                <div>
                  <label className={label}>Pro anual (S/)</label>
                  <input
                    className={input}
                    inputMode="decimal"
                    value={form.proYearly}
                    onChange={set("proYearly")}
                  />
                </div>
                <div>
                  <label className={label}>Comisión Free (%)</label>
                  <input
                    className={input}
                    inputMode="decimal"
                    value={form.commissionPct}
                    onChange={set("commissionPct")}
                  />
                </div>
              </div>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Método de pago
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 text-sm text-gray-700">
                {/* <DemoBadge /> */}
                Tarjeta de debito
              </div>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Cuenta de destino
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Cuenta donde la app recibe sus ingresos. Solo la ven los
                administradores.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>Banco</label>
                  <input
                    className={input}
                    placeholder="BCP, Interbank, BBVA…"
                    value={form.payoutBank}
                    onChange={set("payoutBank")}
                  />
                </div>
                <div>
                  <label className={label}>Titular</label>
                  <input
                    className={input}
                    value={form.payoutHolder}
                    onChange={set("payoutHolder")}
                  />
                </div>
                <div>
                  <label className={label}>Número de cuenta o tarjeta</label>
                  <input
                    className={input}
                    inputMode="numeric"
                    value={form.payoutAccount}
                    onChange={set("payoutAccount")}
                  />
                </div>
                <div>
                  <label className={label}>CCI (20 dígitos)</label>
                  <input
                    className={input}
                    inputMode="numeric"
                    value={form.payoutCci}
                    onChange={set("payoutCci")}
                  />
                </div>
              </div>
            </section>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#057f78] hover:bg-[#046860] text-white font-semibold disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vista principal ────────────────────────────────────────────────────────

export default function AdminPaymentsView() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<AdminPaymentsSummaryDto | null>(null);
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ListPaymentsParams>({ page: 1 });
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [pendingAction, setPendingAction] = useState<{
    payment: PaymentDto;
    action: AdminPaymentAction;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        getAdminPayments(token, {
          ...filters,
          limit: 20,
          search: search.trim() || undefined,
        }),
        getAdminPaymentsSummary(token),
      ]);
      setPayments(list.payments);
      setTotalPages(list.pagination.totalPages);
      setSummary(sum);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Error al cargar pagos",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [token, filters, search, showToast]);

  // `dashboard` cambia con cada evento de socket (nuevo pago, verificación…):
  // así la lista y el resumen se actualizan solos durante una demo.
  const { dashboard } = useAdmin();
  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search, dashboard]);

  const setFilter =
    (key: keyof ListPaymentsParams) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setFilters((f) => ({
        ...f,
        page: 1,
        [key]: e.target.value || undefined,
      }));

  const openAction = (payment: PaymentDto, action: AdminPaymentAction) => {
    setActionError(null);
    setPendingAction({ payment, action });
  };

  const confirmAction = async () => {
    if (!token || !pendingAction) return;
    const { payment, action } = pendingAction;
    setActionLoading(true);
    setActionError(null);
    try {
      await runAdminPaymentAction(token, payment.id, action);
      showToast(ACTION_COPY[action].success, "success");
      setPendingAction(null);
      void load();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "No se pudo completar la acción",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const select =
    "py-2.5 px-3 rounded-xl border border-gray-200 text-sm bg-white";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pagos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Planes Pro y asesorías en garantía. Todos los pagos son con tarjeta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#057f78] bg-[#effaf8] border border-[#057f78]/20 hover:bg-[#057f78] hover:text-white px-4 py-2.5 rounded-xl transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <SummaryCard
            icon={Banknote}
            label="Ingresos de la app"
            value={formatPen(
              summary.test.revenueCents + summary.live.revenueCents,
            )}
            hint="Planes + comisiones"
          />
          <SummaryCard
            icon={Crown}
            label="Planes Pro vendidos"
            value={String(
              summary.test.approvedPlans + summary.live.approvedPlans,
            )}
            hint={`${summary.activeProUsers} usuarios Pro activos`}
          />
          <SummaryCard
            icon={ShieldCheck}
            label="En garantía"
            value={formatPen(summary.test.heldCents + summary.live.heldCents)}
            hint="Asesorías pendientes de calificar"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Código o correo"
            value={search}
            onChange={(e) => {
              setFilters((f) => ({ ...f, page: 1 }));
              setSearch(e.target.value);
            }}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm w-64 focus:ring-2 focus:ring-[#057f78]/30"
          />
        </div>
        <select
          value={filters.status ?? ""}
          onChange={setFilter("status")}
          className={select}
        >
          <option value="">Todos los estados</option>
          {Object.entries(PAYMENT_STATUS_LABEL).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
        <select
          value={filters.purpose ?? ""}
          onChange={setFilter("purpose")}
          className={select}
        >
          <option value="">Planes y asesorías</option>
          <option value="PLAN_SUBSCRIPTION">Planes Pro</option>
          <option value="ASESORIA_ESCROW">Asesorías</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#057f78]" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-sm text-gray-500">
          No hay pagos con estos filtros.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3 font-semibold">Pago</th>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Concepto</th>
                  <th className="px-4 py-3 font-semibold">Método</th>
                  <th className="px-4 py-3 font-semibold text-right">Monto</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 align-top">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-700">
                        {p.code}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {/* {formatDateTime(p.createdAt)} */}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${p.payer.id}`}
                        className="font-medium text-gray-800 hover:text-[#057f78]"
                      >
                        {p.payer.name}
                      </Link>
                      <p className="text-[11px] text-gray-400">
                        {p.payer.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-gray-700 truncate">{p.description}</p>
                      {p.payee && (
                        <p className="text-[11px] text-gray-400">
                          Ayudante: {p.payee.name}
                        </p>
                      )}
                      {p.declineReason && (
                        <p className="text-[11px] text-rose-500 truncate">
                          {p.declineReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{paymentMethodLabel(p)}</p>
                      {/* {p.mode === "TEST" && (
                        <DemoBadge detail={false} className="mt-1" />
                      )} */}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold text-gray-800">
                        {formatPen(p.amountCents)}
                      </p>
                      {p.status === "RELEASED" && p.commissionCents > 0 && (
                        <p className="text-[11px] text-[#057f78]">
                          Comisión {formatPen(p.commissionCents)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${PAYMENT_STATUS_STYLE[p.status]}`}
                      >
                        {PAYMENT_STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PaymentActions payment={p} onAction={openAction} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={(filters.page ?? 1) <= 1}
            onClick={() =>
              setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
            }
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            {filters.page ?? 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={(filters.page ?? 1) >= totalPages}
            onClick={() =>
              setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
            }
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {ACTION_COPY[pendingAction.action].title}
            </h3>
            <div className="rounded-xl bg-gray-50 px-4 py-3 mb-4 text-sm">
              <p className="font-mono text-xs text-gray-500">
                {pendingAction.payment.code}
              </p>
              <p className="font-semibold text-gray-800">
                {formatPen(pendingAction.payment.amountCents)} ·{" "}
                {pendingAction.payment.description}
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {ACTION_COPY[pendingAction.action].body}
            </p>
            {actionError && (
              <p className="text-sm text-rose-600 mb-3">{actionError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmAction()}
                disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-white font-semibold disabled:opacity-60 ${
                  pendingAction.action === "refund"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#057f78] hover:bg-[#046860]"
                }`}
              >
                {actionLoading
                  ? "Procesando…"
                  : ACTION_COPY[pendingAction.action].confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && token && (
        <SettingsModal
          token={token}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}
