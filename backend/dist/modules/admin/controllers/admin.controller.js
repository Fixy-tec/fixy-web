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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.updateUserRole = updateUserRole;
exports.deleteUser = deleteUser;
exports.getDashboard = getDashboard;
const zod_1 = require("zod");
const admin_schema_1 = require("../../../validators/admin.schema");
const adminService = __importStar(require("../services/admin.service"));
const admin_service_1 = require("../services/admin.service");
async function listUsers(req, res) {
    try {
        const validated = admin_schema_1.listUsersQuerySchema.parse(req.query);
        const result = await adminService.listUsers(validated);
        return res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: error.issues[0]?.message || "Parámetros de consulta inválidos",
            });
        }
        console.error("[GET /api/admin/users]", error);
        return res.status(500).json({ message: "Error al listar usuarios" });
    }
}
async function updateUserRole(req, res) {
    try {
        const authReq = req;
        const adminId = authReq.user?.userId;
        if (!adminId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const validated = admin_schema_1.updateUserRoleSchema.parse(req.body);
        const user = await adminService.changeUserRole(adminId, id, validated.role);
        return res.json({ user });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: error.issues[0]?.message || "Datos inválidos",
            });
        }
        if (error instanceof admin_service_1.UserNotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (error instanceof admin_service_1.ActiveAcademicProcessError ||
            error instanceof admin_service_1.SelfRoleChangeError) {
            return res.status(409).json({ message: error.message });
        }
        console.error("[PATCH /api/admin/users/:id/role]", error);
        return res.status(500).json({ message: "Error al cambiar rol" });
    }
}
async function deleteUser(req, res) {
    try {
        const authReq = req;
        const adminId = authReq.user?.userId;
        if (!adminId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const user = await adminService.deleteUser(adminId, id);
        return res.json({ user, message: "Usuario desactivado correctamente" });
    }
    catch (error) {
        if (error instanceof admin_service_1.UserNotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (error instanceof admin_service_1.ActiveAcademicProcessError ||
            error instanceof admin_service_1.RootAdminDeleteError) {
            return res.status(409).json({ message: error.message });
        }
        console.error("[DELETE /api/admin/users/:id]", error);
        return res.status(500).json({ message: "Error al eliminar usuario" });
    }
}
async function getDashboard(req, res) {
    try {
        const dashboard = await adminService.getDashboard();
        return res.json(dashboard);
    }
    catch (error) {
        console.error("[GET /api/admin/dashboard]", error);
        return res.status(500).json({ message: "Error al obtener dashboard" });
    }
}
