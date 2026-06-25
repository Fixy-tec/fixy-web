"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleSchema = exports.listLogsQuerySchema = exports.listUsersQuerySchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.listUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    role: zod_1.z.nativeEnum(client_1.Role).optional(),
    search: zod_1.z.string().trim().optional(),
});
exports.listLogsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(30),
    action: zod_1.z.string().trim().optional(),
    adminId: zod_1.z.string().uuid().optional(),
    targetUserId: zod_1.z.string().uuid().optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
});
exports.updateUserRoleSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(client_1.Role),
});
