"use client";

import { AlertTriangle, X } from "lucide-react";
import FixoMascot from "@/src/components/admin/FixoMascot";
import type { AdminRole, AdminUserDto } from "@/src/lib/admin";

interface RoleChangeModalProps {
  user: AdminUserDto;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (role: AdminRole) => void;
}

export default function RoleChangeModal({
  user,
  open,
  loading = false,
  onClose,
  onConfirm,
}: RoleChangeModalProps) {
  const newRole: AdminRole = user.role === "ADMIN" ? "USER" : "ADMIN";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">Cambiar rol</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <FixoMascot variant="arte" size={80} />
        </div>

        <p className="text-sm text-gray-600 text-center mb-4">
          Vas a cambiar el rol de <strong>{user.name}</strong> a{" "}
          <strong>{newRole}</strong>.
        </p>

        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            No se puede cambiar el rol si el usuario tiene requests activos o
            applications aceptadas.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(newRole)}
            className="flex-1 py-2.5 rounded-xl bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
