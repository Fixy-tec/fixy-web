"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FixoMascot from "@/src/components/admin/FixoMascot";
import Link from "next/link";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import {
  deleteUser,
  getUserDetail,
  getUsers,
  updateUserRole,
  type AdminRole,
  type AdminUserDto,
} from "@/src/lib/admin";
import {
  mapUserDtoToProfile,
  resolveAvatarUrl,
  type CurrentUserDto,
} from "@/src/lib/user";
import { fetchRequestsByCreator } from "@/src/lib/request";
import { fetchApplicationsByApplicant } from "@/src/lib/application";
import { isHttpError } from "@/src/lib/httpError";
import AdminBadge from "@/src/components/admin/AdminBadge";
import RoleChangeModal from "@/src/components/admin/RoleChangeModal";
import DeleteUserModal from "@/src/components/admin/DeleteUserModal";
import { getMedalByPoints } from "@/src/lib/medals";

interface Props {
  userId: string;
}

export default function AdminUserDetailView({ userId }: Props) {
  const router = useRouter();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [user, setUser] = useState<CurrentUserDto | null>(null);
  const [adminMeta, setAdminMeta] = useState<AdminUserDto | null>(null);
  const [requests, setRequests] = useState<Awaited<ReturnType<typeof fetchRequestsByCreator>>>([]);
  const [applications, setApplications] = useState<Awaited<ReturnType<typeof fetchApplicationsByApplicant>>>([]);
  const [loading, setLoading] = useState(true);
  const [roleOpen, setRoleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [detail, reqs, apps, list] = await Promise.all([
        getUserDetail(token, userId),
        fetchRequestsByCreator(userId),
        fetchApplicationsByApplicant(userId),
        getUsers(token, { search: "", limit: 100 }),
      ]);
      setUser(detail);
      setRequests(reqs);
      setApplications(apps);
      const meta = list.users.find((u) => u.id === userId) ?? null;
      setAdminMeta(
        meta ?? {
          id: detail.id,
          name: detail.name,
          email: detail.email,
          role: detail.role as AdminRole,
          status: detail.isActive ? "ACTIVE" : "INACTIVE",
          createdAt: detail.createdAt,
          requestsCreated: reqs.length,
          applicationsSent: apps.length,
          isRootAdmin: !!(detail as CurrentUserDto & { isRootAdmin?: boolean }).isRootAdmin,
        },
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error al cargar usuario", "error");
    } finally {
      setLoading(false);
    }
  }, [token, userId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const locked = adminMeta?.isRootAdmin ?? false;
  const profile = user ? mapUserDtoToProfile(user) : null;
  const medalColor = profile ? getMedalByPoints(profile.points).color : "#1a4ca3";

  const handleRole = async (role: AdminRole) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await updateUserRole(token, userId, role);
      showToast("Rol actualizado", "success");
      setRoleOpen(false);
      void load();
    } catch (e) {
      showToast(
        isHttpError(e, 409)
          ? "El usuario tiene procesos activos"
          : e instanceof Error
            ? e.message
            : "Error",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      await deleteUser(token, userId);
      showToast("Usuario desactivado", "success");
      router.push("/admin/users");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  if (!user || !profile || !adminMeta) {
    return (
      <div className="text-center py-16">
        <FixoMascot variant="pirata" size={120} className="mx-auto mb-4" />
        <p className="text-gray-600">Usuario no encontrado</p>
        <Link href="/admin/users" className="text-[#1a4ca3] text-sm mt-4 inline-block">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a4ca3] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Usuarios
      </Link>

      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
        style={{ borderTopWidth: 4, borderTopColor: medalColor }}
      >
        <div className="p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Image
              src={resolveAvatarUrl(user.profile?.avatarUrl)}
              alt={user.name}
              width={88}
              height={88}
              className="rounded-2xl object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                {user.role === "ADMIN" && (
                  <AdminBadge isRoot={adminMeta.isRootAdmin} />
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(profile.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#1a4ca3] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              ["Medalla", profile.medal],
              ["Puntos", String(profile.points)],
              ["Rating", profile.rating.toFixed(1)],
              ["Estado", adminMeta.status === "ACTIVE" ? "Activo" : "Inactivo"],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase">{label}</p>
                <p className="font-bold text-gray-800 mt-1">{value}</p>
              </div>
            ))}
          </div>

          {!locked && (
            <div className="flex flex-wrap gap-2 mt-6">
              <button
                type="button"
                onClick={() => setRoleOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#eff4ff] text-[#1a4ca3] text-sm font-semibold"
              >
                <Shield className="w-4 h-4" />
                Cambiar rol
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold"
              >
                Desactivar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3">Requests ({requests.length})</h3>
          {requests.length === 0 ? (
            <p className="text-sm text-gray-500">Sin solicitudes creadas</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {requests.slice(0, 5).map((r) => (
                <li key={r.id} className="flex justify-between gap-2 py-2 border-b border-gray-50">
                  <span className="truncate text-gray-700">{r.title}</span>
                  <span className="text-xs text-gray-400 shrink-0">{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3">Applications ({applications.length})</h3>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">Sin postulaciones</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {applications.slice(0, 5).map((a) => (
                <li key={a.id} className="flex justify-between gap-2 py-2 border-b border-gray-50">
                  <span className="truncate text-gray-700">{a.request?.title ?? a.requestId}</span>
                  <span className="text-xs text-gray-400 shrink-0">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {roleOpen && (
        <RoleChangeModal
          user={adminMeta}
          open
          loading={actionLoading}
          onClose={() => setRoleOpen(false)}
          onConfirm={handleRole}
        />
      )}
      {deleteOpen && (
        <DeleteUserModal
          user={adminMeta}
          open
          loading={actionLoading}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
