"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import type { AdminUserDto } from "@/src/lib/admin";
import AdminBadge from "@/src/components/admin/AdminBadge";

interface AdminUsersTableProps {
  users: AdminUserDto[];
  onRoleChange: (user: AdminUserDto) => void;
  onDelete: (user: AdminUserDto) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatWhatsapp(value?: string | null) {
  if (!value?.trim()) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 9) return digits.slice(-9);
  return value;
}

function UserActions({
  user,
  onRoleChange,
  onDelete,
}: {
  user: AdminUserDto;
  onRoleChange: () => void;
  onDelete: () => void;
}) {
  const locked = user.isRootAdmin;
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/users/${user.id}`}
        className="p-2 rounded-lg text-gray-500 hover:text-[#1a4ca3] hover:bg-[#eff4ff]"
        title="Ver"
      >
        <Eye className="w-4 h-4" />
      </Link>
      <button
        type="button"
        disabled={locked}
        onClick={onRoleChange}
        className="p-2 rounded-lg text-gray-500 hover:text-[#057f78] hover:bg-[#effaf8] disabled:opacity-40"
        title="Editar rol"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        disabled={locked}
        onClick={onDelete}
        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminUsersTable({
  users,
  onRoleChange,
  onDelete,
}: AdminUsersTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Whatsapp</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Registro</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{user.name}</span>
                      {user.isRootAdmin && (
                        <AdminBadge isRoot className="text-[10px] px-1.5 py-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatWhatsapp(user.whatsapp)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-[#effaf8] text-[#057f78]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        user.status === "ACTIVE" ? "text-[#009c70]" : "text-gray-400"
                      }`}
                    >
                      {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <UserActions
                      user={user}
                      onRoleChange={() => onRoleChange(user)}
                      onDelete={() => onDelete(user)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  {user.isRootAdmin && (
                    <AdminBadge isRoot className="text-[10px] px-1.5 py-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
              </div>
              <MoreHorizontal className="w-4 h-4 text-gray-300 shrink-0" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <span className="text-gray-400">WhatsApp</span>
                <p className="font-medium text-gray-700">
                  {formatWhatsapp(user.whatsapp)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Rol</span>
                <p className="font-medium text-gray-700">{user.role}</p>
              </div>
              <div>
                <span className="text-gray-400">Estado</span>
                <p
                  className={`font-medium ${
                    user.status === "ACTIVE" ? "text-[#009c70]" : "text-gray-400"
                  }`}
                >
                  {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Registro</span>
                <p className="font-medium text-gray-700">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
              <Link
                href={`/admin/users/${user.id}`}
                className="flex-1 text-center py-2 rounded-xl bg-[#eff4ff] text-[#1a4ca3] text-xs font-semibold"
              >
                Ver
              </Link>
              <button
                type="button"
                disabled={user.isRootAdmin}
                onClick={() => onRoleChange(user)}
                className="flex-1 py-2 rounded-xl bg-[#effaf8] text-[#057f78] text-xs font-semibold disabled:opacity-40"
              >
                Editar
              </button>
              <button
                type="button"
                disabled={user.isRootAdmin}
                onClick={() => onDelete(user)}
                className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold disabled:opacity-40"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
