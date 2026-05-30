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
exports.listMyNotifications = listMyNotifications;
exports.deleteMyNotification = deleteMyNotification;
exports.clearMyNotifications = clearMyNotifications;
const notificationsService = __importStar(require("../services/notifications.service"));
/**
 * GET /api/notifications?limit=20
 * Lista las notificaciones del usuario autenticado (más recientes primero).
 */
async function listMyNotifications(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const limitRaw = req.query.limit;
        const limit = typeof limitRaw === "string" && !Number.isNaN(Number(limitRaw))
            ? Math.max(1, Math.min(Number(limitRaw), 50))
            : undefined;
        const notifications = await notificationsService.getMyNotifications(userId, limit);
        return res.json({ notifications });
    }
    catch (error) {
        console.error("[GET /notifications] error:", error);
        return res
            .status(500)
            .json({ message: error?.message ?? "Failed to load notifications" });
    }
}
/**
 * DELETE /api/notifications/:id
 * "Marcar como visto" → elimina la notificación.
 */
async function deleteMyNotification(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        await notificationsService.deleteMyNotification(req.params.id, userId);
        return res.status(204).send();
    }
    catch (error) {
        if (error?.message === "Notification not found") {
            return res.status(404).json({ message: "Notification not found" });
        }
        console.error("[DELETE /notifications/:id] error:", error);
        return res
            .status(500)
            .json({ message: error?.message ?? "Failed to delete notification" });
    }
}
/**
 * DELETE /api/notifications
 * Borra todas las notificaciones del usuario.
 */
async function clearMyNotifications(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const deleted = await notificationsService.clearMyNotifications(userId);
        return res.json({ deleted });
    }
    catch (error) {
        console.error("[DELETE /notifications] error:", error);
        return res
            .status(500)
            .json({ message: error?.message ?? "Failed to clear notifications" });
    }
}
