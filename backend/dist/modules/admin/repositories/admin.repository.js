"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.countActiveRequestsByUser = countActiveRequestsByUser;
exports.countAcceptedApplicationsByUser = countAcceptedApplicationsByUser;
exports.updateUserRole = updateUserRole;
exports.softDeleteUser = softDeleteUser;
exports.createAdminLog = createAdminLog;
exports.getDashboardStats = getDashboardStats;
exports.getAdminLogs = getAdminLogs;
const prisma_1 = __importDefault(require("../../../prisma"));
const admin_constants_1 = require("../constants/admin.constants");
async function getUsers(filters) {
    const { page, limit, role, search } = filters;
    const skip = (page - 1) * limit;
    const where = {};
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
        prisma_1.default.user.findMany({
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
        prisma_1.default.user.count({ where }),
    ]);
    return { users, total, page, limit };
}
async function getUserById(id) {
    return prisma_1.default.user.findUnique({
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
async function countActiveRequestsByUser(userId) {
    return prisma_1.default.request.count({
        where: {
            creatorId: userId,
            status: { in: admin_constants_1.ACTIVE_REQUEST_STATUSES },
        },
    });
}
async function countAcceptedApplicationsByUser(userId) {
    return prisma_1.default.application.count({
        where: {
            applicantId: userId,
            status: admin_constants_1.BLOCKING_APPLICATION_STATUS,
        },
    });
}
async function updateUserRole(userId, role, tx) {
    const db = tx ?? prisma_1.default;
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
async function softDeleteUser(userId, tx) {
    const db = tx ?? prisma_1.default;
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
async function createAdminLog(data, tx) {
    const db = tx ?? prisma_1.default;
    return db.adminLog.create({ data });
}
async function getDashboardStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [totalUsers, activeUsers, usersByRole, requestsByStatus, applicationsByStatus, totalApplications, totalRequests, acceptedApplications, requestsLast7Days, topUsersByRequests, topUsersByApplications,] = await Promise.all([
        prisma_1.default.user.count(),
        prisma_1.default.user.count({ where: { isActive: true } }),
        prisma_1.default.user.groupBy({
            by: ["role"],
            _count: { role: true },
        }),
        prisma_1.default.request.groupBy({
            by: ["status"],
            _count: { status: true },
        }),
        prisma_1.default.application.groupBy({
            by: ["status"],
            _count: { status: true },
        }),
        prisma_1.default.application.count(),
        prisma_1.default.request.count(),
        prisma_1.default.application.count({ where: { status: "ACEPTADA" } }),
        prisma_1.default.request.count({
            where: { createdAt: { gte: sevenDaysAgo } },
        }),
        prisma_1.default.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                _count: { select: { requestsCreated: true } },
            },
            orderBy: { requestsCreated: { _count: "desc" } },
            take: 5,
        }),
        prisma_1.default.user.findMany({
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
    const roleCounts = { USER: 0, ADMIN: 0 };
    for (const group of usersByRole) {
        roleCounts[group.role] = group._count.role;
    }
    const requestCounts = {
        ABIERTA: 0,
        EN_REVISION: 0,
        EN_PROCESO: 0,
        COMPLETADA: 0,
        CANCELADA: 0,
    };
    for (const group of requestsByStatus) {
        requestCounts[group.status] = group._count.status;
    }
    const applicationCounts = {
        PENDIENTE: 0,
        ACEPTADA: 0,
        RECHAZADA: 0,
    };
    for (const group of applicationsByStatus) {
        applicationCounts[group.status] = group._count.status;
    }
    const activityMap = new Map();
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
        }
        else {
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
    const avgApplicationsPerRequest = totalRequests > 0
        ? Math.round((totalApplications / totalRequests) * 100) / 100
        : 0;
    const acceptanceRate = totalApplications > 0
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
async function getAdminLogs(filters) {
    const { page, limit, action, adminId, targetUserId, from, to } = filters;
    const skip = (page - 1) * limit;
    const where = {};
    if (action)
        where.action = { contains: action, mode: "insensitive" };
    if (adminId)
        where.adminId = adminId;
    if (targetUserId)
        where.targetUserId = targetUserId;
    if (from || to) {
        where.createdAt = {};
        if (from)
            where.createdAt.gte = from;
        if (to)
            where.createdAt.lte = to;
    }
    const [logs, total] = await Promise.all([
        prisma_1.default.adminLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                admin: { select: { id: true, name: true, email: true } },
                targetUser: { select: { id: true, name: true, email: true } },
            },
        }),
        prisma_1.default.adminLog.count({ where }),
    ]);
    return { logs, total, page, limit };
}
