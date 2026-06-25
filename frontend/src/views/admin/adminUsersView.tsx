"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import {
  deleteUser,
  getUsers,
  updateUserRole,
  type AdminRole,
  type AdminUserDto,
} from "@/src/lib/admin";
import { isHttpError } from "@/src/lib/httpError";
import AdminUsersTable from "@/src/components/admin/AdminUsersTable";
import RoleChangeModal from "@/src/components/admin/RoleChangeModal";
import DeleteUserModal from "@/src/components/admin/DeleteUserModal";
import FixoMascot from "@/src/components/admin/FixoMascot";

export default function AdminUsersView() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminRole | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleTarget, setRoleTarget] = useState<AdminUserDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserDto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await getUsers(token, {
        page,
        limit: 15,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });
      setUsers(result.users);
      setTotalPages(result.pagination.totalPages);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Error al cargar usuarios",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [token, page, search, roleFilter, showToast]);

  useEffect(() => {
    const t = setTimeout(() => void loadUsers(), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadUsers, search]);

  const handleRoleConfirm = async (role: AdminRole) => {
    if (!token || !roleTarget) return;
    setActionLoading(true);
    try {
      await updateUserRole(token, roleTarget.id, role);
      showToast("Rol actualizado correctamente", "success");
      setRoleTarget(null);
      void loadUsers();
    } catch (e) {
      const msg =
        isHttpError(e, 409)
          ? "El usuario tiene procesos activos"
          : e instanceof Error
            ? e.message
            : "Error al cambiar rol";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteUser(token, deleteTarget.id);
      showToast("Usuario desactivado", "success");
      setDeleteTarget(null);
      void loadUsers();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "No se pudo eliminar",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Usuarios</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona cuentas, roles y estado sin exponer datos sensibles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar nombre o email"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm w-64 focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value as AdminRole | "");
            }}
            className="py-2.5 px-3 rounded-xl border border-gray-200 text-sm"
          >
            <option value="">Todos los roles</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FixoMascot variant="hacker" size={120} className="mx-auto mb-4 opacity-90" />
          <p className="text-gray-600 font-medium">No se encontraron usuarios</p>
        </div>
      ) : (
        <AdminUsersTable
          users={users}
          onRoleChange={setRoleTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {roleTarget && (
        <RoleChangeModal
          user={roleTarget}
          open
          loading={actionLoading}
          onClose={() => setRoleTarget(null)}
          onConfirm={handleRoleConfirm}
        />
      )}
      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          open
          loading={actionLoading}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
