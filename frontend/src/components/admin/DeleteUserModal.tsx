"use client";

import { AlertTriangle, X } from "lucide-react";
import FixoMascot from "@/src/components/admin/FixoMascot";
import type { AdminUserDto } from "@/src/lib/admin";

interface DeleteUserModalProps {
  user: AdminUserDto;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteUserModal({
  user,
  open,
  loading = false,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">¿Eliminar usuario?</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <FixoMascot variant="karate" size={80} />
        </div>

        <p className="text-sm text-gray-600 text-center mb-4">
          Se desactivará la cuenta de <strong>{user.email}</strong>. Esta acción
          es reversible solo desde base de datos.
        </p>

        <ul className="text-xs text-gray-500 space-y-1 mb-4 list-disc list-inside">
          <li>No debe tener requests en OPEN, REVIEW o PROCESSING</li>
          <li>No debe tener applications aceptadas</li>
          <li>El admin principal no puede eliminarse</li>
        </ul>

        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">
            Si el usuario tiene procesos académicos activos, la operación será
            rechazada.
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
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60"
          >
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
