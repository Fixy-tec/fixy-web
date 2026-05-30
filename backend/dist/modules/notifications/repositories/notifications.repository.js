"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationForUser = createNotificationForUser;
exports.getUserNotifications = getUserNotifications;
exports.getUserNotificationCount = getUserNotificationCount;
exports.deleteNotificationForUser = deleteNotificationForUser;
exports.deleteAllNotificationsForUser = deleteAllNotificationsForUser;
const prisma_1 = __importDefault(require("../../../prisma"));
/**
 * Crea una notificación dirigida a un único usuario.
 *
 * Aprovechamos el modelo existente `Notification` + `NotificationRecipient`
 * pero usándolo como una relación 1:1 (cada notificación tiene exactamente
 * un destinatario). Ignoramos `read`/`readAt` a propósito: en este sistema
 * "marcar como visto" elimina la notificación (cascade limpia el recipient).
 */
async function createNotificationForUser(input) {
    return prisma_1.default.notification.create({
        data: {
            type: input.type,
            title: input.title,
            message: input.message,
            data: input.data,
            recipients: {
                create: {
                    userId: input.userId,
                },
            },
        },
    });
}
/**
 * Lista las notificaciones de un usuario ordenadas de más reciente a más
 * antigua. Permite limitar el resultado para el bell + dropdown.
 */
async function getUserNotifications(userId, limit) {
    return prisma_1.default.notification.findMany({
        where: {
            recipients: { some: { userId } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}
async function getUserNotificationCount(userId) {
    return prisma_1.default.notification.count({
        where: { recipients: { some: { userId } } },
    });
}
/**
 * Elimina una notificación (botón "marcar como visto"), pero solo si el
 * usuario que invoca es destinatario. Devuelve `true` si efectivamente se
 * borró, `false` si no existía o no le pertenecía.
 */
async function deleteNotificationForUser(notificationId, userId) {
    const result = await prisma_1.default.notification.deleteMany({
        where: {
            id: notificationId,
            recipients: { some: { userId } },
        },
    });
    return result.count > 0;
}
/**
 * Borra todas las notificaciones del usuario (botón "limpiar todo"). No es
 * un requisito explícito pero queda barato dejarlo expuesto para futuro.
 */
async function deleteAllNotificationsForUser(userId) {
    const result = await prisma_1.default.notification.deleteMany({
        where: { recipients: { some: { userId } } },
    });
    return result.count;
}
