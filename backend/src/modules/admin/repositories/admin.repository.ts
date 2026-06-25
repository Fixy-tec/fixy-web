import {
  ApplicationStatus,
  Prisma,
  RequestStatus,
  Role,
} from "@prisma/client";
import prisma from "../../../prisma";

type PrismaTx = Prisma.TransactionClient;
import {
  ACTIVE_REQUEST_STATUSES,
  BLOCKING_APPLICATION_STATUS,
} from "../constants/admin.constants";
import type { ListUsersQuery } from "../../../validators/admin.schema";

export async function getUsers(filters: ListUsersQuery) {
  const { page, limit, role, search } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isRootAdmin: true,
        createdAt: true,
        profile: { select: { whatsapp: true } },
        _count: {
          select: {
            requestsCreated: true,
            applications: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isRootAdmin: true,
      createdAt: true,
      profile: { select: { whatsapp: true } },
      _count: {
        select: {
          requestsCreated: true,
          applications: true,
        },
      },
    },
  });
}

export async function countActiveRequestsByUser(userId: string) {
  return prisma.request.count({
    where: {
      creatorId: userId,
      status: { in: ACTIVE_REQUEST_STATUSES },
    },
  });
}

export async function countAcceptedApplicationsByUser(userId: string) {
  return prisma.application.count({
    where: {
      applicantId: userId,
      status: BLOCKING_APPLICATION_STATUS,
    },
  });
}

export async function updateUserRole(
  userId: string,
  role: Role,
  tx?: PrismaTx,
) {
  const db = tx ?? prisma;
  return db.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function softDeleteUser(userId: string, tx?: PrismaTx) {
  const db = tx ?? prisma;
  return db.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function createAdminLog(
  data: {
    adminId: string;
    action: string;
    targetUserId?: string;
    description: string;
  },
  tx?: PrismaTx,
) {
  const db = tx ?? prisma;
  return db.adminLog.create({ data });
}

export async function getDashboardStats() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    activeUsers,
    usersByRole,
    requestsByStatus,
    applicationsByStatus,
    totalApplications,
    totalRequests,
    acceptedApplications,
    requestsLast7Days,
    topUsersByRequests,
    topUsersByApplications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),
    prisma.request.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.application.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.application.count(),
    prisma.request.count(),
    prisma.application.count({ where: { status: "ACEPTADA" } }),
    prisma.request.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { requestsCreated: true } },
      },
      orderBy: { requestsCreated: { _count: "desc" } },
      take: 5,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { applications: true } },
      },
      orderBy: { applications: { _count: "desc" } },
      take: 5,
    }),
  ]);

  const roleCounts: Record<Role, number> = { USER: 0, ADMIN: 0 };
  for (const group of usersByRole) {
    roleCounts[group.role] = group._count.role;
  }

  const requestCounts: Record<RequestStatus, number> = {
    ABIERTA: 0,
    EN_REVISION: 0,
    EN_PROCESO: 0,
    COMPLETADA: 0,
    CANCELADA: 0,
  };
  for (const group of requestsByStatus) {
    requestCounts[group.status] = group._count.status;
  }

  const applicationCounts: Record<ApplicationStatus, number> = {
    PENDIENTE: 0,
    ACEPTADA: 0,
    RECHAZADA: 0,
  };
  for (const group of applicationsByStatus) {
    applicationCounts[group.status] = group._count.status;
  }

  const activityMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      requestsCreated: number;
      applicationsSent: number;
    }
  >();

  for (const user of topUsersByRequests) {
    activityMap.set(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      requestsCreated: user._count.requestsCreated,
      applicationsSent: 0,
    });
  }

  for (const user of topUsersByApplications) {
    const existing = activityMap.get(user.id);
    if (existing) {
      existing.applicationsSent = user._count.applications;
    } else {
      activityMap.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        requestsCreated: 0,
        applicationsSent: user._count.applications,
      });
    }
  }

  const mostActiveUsers = [...activityMap.values()]
    .map((user) => ({
      ...user,
      totalActivity: user.requestsCreated + user.applicationsSent,
    }))
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .slice(0, 5);

  const avgApplicationsPerRequest =
    totalRequests > 0
      ? Math.round((totalApplications / totalRequests) * 100) / 100
      : 0;

  const acceptanceRate =
    totalApplications > 0
      ? Math.round((acceptedApplications / totalApplications) * 10000) / 100
      : 0;

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      byRole: roleCounts,
    },
    requests: {
      total: totalRequests,
      open: requestCounts.ABIERTA,
      review: requestCounts.EN_REVISION,
      processing: requestCounts.EN_PROCESO,
      completed: requestCounts.COMPLETADA,
      cancelled: requestCounts.CANCELADA,
    },
    applications: {
      pending: applicationCounts.PENDIENTE,
      accepted: applicationCounts.ACEPTADA,
      rejected: applicationCounts.RECHAZADA,
    },
    metrics: {
      avgApplicationsPerRequest,
      acceptanceRate,
      mostActiveUsers,
      requestsLast7Days,
    },
  };
}

export async function getAdminLogs(filters: import("../../../validators/admin.schema").ListLogsQuery) {
  const { page, limit, action, adminId, targetUserId, from, to } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.AdminLogWhereInput = {};
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (adminId) where.adminId = adminId;
  if (targetUserId) where.targetUserId = targetUserId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.adminLog.count({ where }),
  ]);

  return { logs, total, page, limit };
}
