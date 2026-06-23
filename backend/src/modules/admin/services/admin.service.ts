import { Role } from "@prisma/client";
import prisma from "../../../prisma";
import * as adminRepository from "../repositories/admin.repository";
import { notifyAdminDashboardUpdate } from "../../../realtime/admin.realtime";
import {
  ACTIVE_ACADEMIC_PROCESS_MESSAGE,
  ROOT_ADMIN_DELETE_MESSAGE,
} from "../constants/admin.constants";
import type { ListUsersQuery } from "../../../validators/admin.schema";
import type {
  AdminUserListItemDto,
  DashboardDto,
  PaginatedUsersDto,
} from "../dto/admin.dto";

export class UserNotFoundError extends Error {
  constructor() {
    super("Usuario no encontrado");
    this.name = "UserNotFoundError";
  }
}

export class ActiveAcademicProcessError extends Error {
  constructor() {
    super(ACTIVE_ACADEMIC_PROCESS_MESSAGE);
    this.name = "ActiveAcademicProcessError";
  }
}

export class RootAdminDeleteError extends Error {
  constructor() {
    super(ROOT_ADMIN_DELETE_MESSAGE);
    this.name = "RootAdminDeleteError";
  }
}

export class SelfRoleChangeError extends Error {
  constructor() {
    super("No puedes cambiar tu propio rol administrativo");
    this.name = "SelfRoleChangeError";
  }
}

function mapUserToDto(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isRootAdmin?: boolean;
  createdAt: Date;
  profile?: { whatsapp: string } | null;
  _count: { requestsCreated: number; applications: number };
}): AdminUserListItemDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.isActive ? "ACTIVE" : "INACTIVE",
    createdAt: user.createdAt,
    requestsCreated: user._count.requestsCreated,
    applicationsSent: user._count.applications,
    isRootAdmin: user.isRootAdmin ?? false,
    whatsapp: user.profile?.whatsapp ?? null,
  };
}

async function userHasActiveAcademicProcesses(userId: string): Promise<boolean> {
  const [activeRequests, acceptedApplications] = await Promise.all([
    adminRepository.countActiveRequestsByUser(userId),
    adminRepository.countAcceptedApplicationsByUser(userId),
  ]);
  return activeRequests > 0 || acceptedApplications > 0;
}

export async function listUsers(
  filters: ListUsersQuery,
): Promise<PaginatedUsersDto> {
  const { users, total, page, limit } =
    await adminRepository.getUsers(filters);

  return {
    users: users.map(mapUserToDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function changeUserRole(
  adminId: string,
  targetUserId: string,
  role: Role,
): Promise<AdminUserListItemDto> {
  if (adminId === targetUserId) {
    throw new SelfRoleChangeError();
  }

  const user = await adminRepository.getUserById(targetUserId);
  if (!user) {
    throw new UserNotFoundError();
  }

  if (user.role === role) {
    return mapUserToDto(user);
  }

  const hasActiveProcesses = await userHasActiveAcademicProcesses(targetUserId);
  if (hasActiveProcesses) {
    throw new ActiveAcademicProcessError();
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedUser = await adminRepository.updateUserRole(
      targetUserId,
      role,
      tx,
    );
    await adminRepository.createAdminLog(
      {
        adminId,
        action: "CHANGE_ROLE",
        targetUserId,
        description: `Rol cambiado de ${user.role} a ${role}`,
      },
      tx,
    );
    return updatedUser;
  });

  void notifyAdminDashboardUpdate();

  return mapUserToDto({
    ...updated,
    isRootAdmin: user.isRootAdmin,
    _count: user._count,
  });
}

export async function deleteUser(
  adminId: string,
  targetUserId: string,
): Promise<AdminUserListItemDto> {
  const user = await adminRepository.getUserById(targetUserId);
  if (!user) {
    throw new UserNotFoundError();
  }

  if (user.isRootAdmin) {
    throw new RootAdminDeleteError();
  }

  if (!user.isActive) {
    return mapUserToDto(user);
  }

  const hasActiveProcesses = await userHasActiveAcademicProcesses(targetUserId);
  if (hasActiveProcesses) {
    throw new ActiveAcademicProcessError();
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const deactivated = await adminRepository.softDeleteUser(targetUserId, tx);
    await adminRepository.createAdminLog(
      {
        adminId,
        action: "SOFT_DELETE_USER",
        targetUserId,
        description: `Usuario desactivado: ${user.email}`,
      },
      tx,
    );
    return deactivated;
  });

  void notifyAdminDashboardUpdate();

  return mapUserToDto({
    ...deleted,
    isRootAdmin: user.isRootAdmin,
    _count: user._count,
  });
}

export async function getDashboard(): Promise<DashboardDto> {
  return adminRepository.getDashboardStats();
}

export async function listLogs(filters: import("../../../validators/admin.schema").ListLogsQuery) {
  const { logs, total, page, limit } = await adminRepository.getAdminLogs(filters);
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
