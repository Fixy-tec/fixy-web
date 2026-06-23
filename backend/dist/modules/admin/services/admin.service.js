"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfRoleChangeError = exports.RootAdminDeleteError = exports.ActiveAcademicProcessError = exports.UserNotFoundError = void 0;
exports.listUsers = listUsers;
exports.changeUserRole = changeUserRole;
exports.deleteUser = deleteUser;
exports.getDashboard = getDashboard;
const prisma_1 = __importDefault(require("../../../prisma"));
const adminRepository = __importStar(require("../repositories/admin.repository"));
const admin_realtime_1 = require("../../../realtime/admin.realtime");
const admin_constants_1 = require("../constants/admin.constants");
class UserNotFoundError extends Error {
    constructor() {
        super("Usuario no encontrado");
        this.name = "UserNotFoundError";
    }
}
exports.UserNotFoundError = UserNotFoundError;
class ActiveAcademicProcessError extends Error {
    constructor() {
        super(admin_constants_1.ACTIVE_ACADEMIC_PROCESS_MESSAGE);
        this.name = "ActiveAcademicProcessError";
    }
}
exports.ActiveAcademicProcessError = ActiveAcademicProcessError;
class RootAdminDeleteError extends Error {
    constructor() {
        super(admin_constants_1.ROOT_ADMIN_DELETE_MESSAGE);
        this.name = "RootAdminDeleteError";
    }
}
exports.RootAdminDeleteError = RootAdminDeleteError;
class SelfRoleChangeError extends Error {
    constructor() {
        super("No puedes cambiar tu propio rol administrativo");
        this.name = "SelfRoleChangeError";
    }
}
exports.SelfRoleChangeError = SelfRoleChangeError;
function mapUserToDto(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.isActive ? "ACTIVE" : "INACTIVE",
        createdAt: user.createdAt,
        requestsCreated: user._count.requestsCreated,
        applicationsSent: user._count.applications,
    };
}
async function userHasActiveAcademicProcesses(userId) {
    const [activeRequests, acceptedApplications] = await Promise.all([
        adminRepository.countActiveRequestsByUser(userId),
        adminRepository.countAcceptedApplicationsByUser(userId),
    ]);
    return activeRequests > 0 || acceptedApplications > 0;
}
async function listUsers(filters) {
    const { users, total, page, limit } = await adminRepository.getUsers(filters);
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
async function changeUserRole(adminId, targetUserId, role) {
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
    const updated = await prisma_1.default.$transaction(async (tx) => {
        const updatedUser = await adminRepository.updateUserRole(targetUserId, role, tx);
        await adminRepository.createAdminLog({
            adminId,
            action: "CHANGE_ROLE",
            targetUserId,
            description: `Rol cambiado de ${user.role} a ${role}`,
        }, tx);
        return updatedUser;
    });
    void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.isActive ? "ACTIVE" : "INACTIVE",
        createdAt: updated.createdAt,
        requestsCreated: user._count.requestsCreated,
        applicationsSent: user._count.applications,
    };
}
async function deleteUser(adminId, targetUserId) {
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
    const deleted = await prisma_1.default.$transaction(async (tx) => {
        const deactivated = await adminRepository.softDeleteUser(targetUserId, tx);
        await adminRepository.createAdminLog({
            adminId,
            action: "SOFT_DELETE_USER",
            targetUserId,
            description: `Usuario desactivado: ${user.email}`,
        }, tx);
        return deactivated;
    });
    void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    return {
        id: deleted.id,
        name: deleted.name,
        email: deleted.email,
        role: deleted.role,
        status: "INACTIVE",
        createdAt: deleted.createdAt,
        requestsCreated: user._count.requestsCreated,
        applicationsSent: user._count.applications,
    };
}
async function getDashboard() {
    return adminRepository.getDashboardStats();
}
