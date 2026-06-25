"use client";

import Link from "next/link";
import { Eye, MoreHorizontal } from "lucide-react";
import type { AdminUserDto } from "@/src/lib/admin";
import AdminBadge from "@/src/components/admin/AdminBadge";
import UserActionsMenu from "@/src/components/admin/UserActionsMenu";

interface AdminUserCardProps {
  user: AdminUserDto;
  onRoleChange: (user: AdminUserDto) => void;
  onDelete: (user: AdminUserDto) => void;
}

export default function AdminUserCard({
  user,
  onRoleChange,
  onDelete,
}: AdminUserCardProps) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-linear-to-br from-[#1a4ca3] to-[#057f78] text-white flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-800 truncate">{user.name}</p>
              {user.role === "ADMIN" && (
                <AdminBadge isRoot={user.isRootAdmin} className="text-[10px] px-2 py-0.5" />
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <UserActionsMenu
          user={user}
          onRoleChange={() => onRoleChange(user)}
          onDelete={() => onDelete(user)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase">Rol</p>
          <p className="font-medium text-gray-700">{user.role}</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase">Estado</p>
          <p
            className={`font-medium ${
              user.status === "ACTIVE" ? "text-[#009c70]" : "text-gray-400"
            }`}
          >
            {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase">Requests</p>
          <p className="font-medium text-gray-700">{user.requestsCreated}</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase">Applications</p>
          <p className="font-medium text-gray-700">{user.applicationsSent}</p>
        </div>
      </div>

      <Link
        href={`/admin/users/${user.id}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a4ca3] hover:text-[#143d87]"
      >
        <Eye className="w-4 h-4" />
        Ver detalle
      </Link>
    </div>
  );
}
