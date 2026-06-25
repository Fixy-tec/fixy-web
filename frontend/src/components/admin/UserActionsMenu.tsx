"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Shield, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import type { AdminUserDto } from "@/src/lib/admin";

interface UserActionsMenuProps {
  user: AdminUserDto;
  onRoleChange: () => void;
  onDelete: () => void;
}

export default function UserActionsMenu({
  user,
  onRoleChange,
  onDelete,
}: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const locked = user.isRootAdmin;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
        aria-label="Acciones"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-20">
          <Link
            href={`/admin/users/${user.id}`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <Eye className="w-4 h-4" />
            Ver
          </Link>
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              setOpen(false);
              onRoleChange();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Shield className="w-4 h-4" />
            Cambiar rol
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
