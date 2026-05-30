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
exports.getMyNotifications = getMyNotifications;
exports.deleteMyNotification = deleteMyNotification;
exports.clearMyNotifications = clearMyNotifications;
exports.notifyApplicationReceived = notifyApplicationReceived;
exports.notifyApplicationAccepted = notifyApplicationAccepted;
exports.notifyApplicationRejected = notifyApplicationRejected;
exports.notifyRatingReceived = notifyRatingReceived;
exports.notifyRankUp = notifyRankUp;
const notificationsRepository = __importStar(require("../repositories/notifications.repository"));
const MEDAL_LABEL = {
    HIERRO: "Hierro",
    BRONCE: "Bronce",
    PLATA: "Plata",
    ORO: "Oro",
    DIAMANTE: "Diamante",
    MAESTRO: "Maestro",
    CHALLENGER: "Challenger",
};
// ── CRUD básico expuesto por el controller ────────────────────────────────
async function getMyNotifications(userId, limit) {
    return notificationsRepository.getUserNotifications(userId, limit);
}
async function deleteMyNotification(notificationId, userId) {
    const deleted = await notificationsRepository.deleteNotificationForUser(notificationId, userId);
    if (!deleted) {
        throw new Error("Notification not found");
    }
}
async function clearMyNotifications(userId) {
    return notificationsRepository.deleteAllNotificationsForUser(userId);
}
// ── Helpers de "trigger" usados desde otros módulos ───────────────────────
//
// Todos los helpers atrapan errores internamente (`.catch`) porque una
// notificación que falla NUNCA debe romper el flujo principal (aceptar una
// postulación, registrar una calificación, etc.). Si falla, se loguea y
// el caller continúa.
function safeCreate(input) {
    return notificationsRepository
        .createNotificationForUser({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
    })
        .catch((error) => {
        console.error(`[notifications] Failed to create '${input.type}' for ${input.userId}:`, error);
        return null;
    });
}
async function notifyApplicationReceived(args) {
    return safeCreate({
        userId: args.creatorId,
        type: "APPLICATION_RECEIVED",
        title: "Nueva postulación",
        message: `${args.applicantName} se postuló a tu solicitud "${args.requestTitle}".`,
        data: {
            requestId: args.requestId,
            applicationId: args.applicationId,
        },
    });
}
async function notifyApplicationAccepted(args) {
    return safeCreate({
        userId: args.applicantId,
        type: "APPLICATION_ACCEPTED",
        title: "¡Te aceptaron!",
        message: `Tu postulación a "${args.requestTitle}" fue aceptada.`,
        data: {
            requestId: args.requestId,
            applicationId: args.applicationId,
        },
    });
}
async function notifyApplicationRejected(args) {
    return safeCreate({
        userId: args.applicantId,
        type: "APPLICATION_REJECTED",
        title: "Postulación rechazada",
        message: `Tu postulación a "${args.requestTitle}" fue rechazada.`,
        data: {
            requestId: args.requestId,
            applicationId: args.applicationId,
        },
    });
}
/**
 * Se usa para "te calificaron". Reutilizamos `REQUEST_COMPLETED` porque el
 * evento siempre ocurre tras completarse el request y evita ampliar el enum.
 */
async function notifyRatingReceived(args) {
    return safeCreate({
        userId: args.ratedUserId,
        type: "REQUEST_COMPLETED",
        title: `Recibiste una calificación de ${args.stars}★`,
        message: `${args.raterName} te calificó en "${args.requestTitle}".`,
        data: {
            requestId: args.requestId,
            stars: args.stars,
        },
    });
}
async function notifyRankUp(args) {
    const label = MEDAL_LABEL[args.newMedal] ?? args.newMedal;
    return safeCreate({
        userId: args.userId,
        type: "RANK_UP",
        title: `¡Subiste a ${label}!`,
        message: `Alcanzaste ${args.newPoints.toLocaleString()} puntos y ascendiste a la liga ${label}.`,
        data: {
            newMedal: args.newMedal,
            previousMedal: args.previousMedal,
            newPoints: args.newPoints,
        },
    });
}
