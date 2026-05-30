import prisma from "../../../prisma";
import { NotificationType, Prisma } from "@prisma/client";

/**
 * Crea una notificación dirigida a un único usuario.
 *
 * Aprovechamos el modelo existente `Notification` + `NotificationRecipient`
 * pero usándolo como una relación 1:1 (cada notificación tiene exactamente
 * un destinatario). Ignoramos `read`/`readAt` a propósito: en este sistema
 * "marcar como visto" elimina la notificación (cascade limpia el recipient).
 */
export async function createNotificationForUser(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
}) {
  return prisma.notification.create({
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
export async function getUserNotifications(userId: string, limit?: number) {
  return prisma.notification.findMany({
    where: {
      recipients: { some: { userId } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUserNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipients: { some: { userId } } },
  });
}

/**
 * Elimina una notificación (botón "marcar como visto"), pero solo si el
 * usuario que invoca es destinatario. Devuelve `true` si efectivamente se
 * borró, `false` si no existía o no le pertenecía.
 */
export async function deleteNotificationForUser(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.notification.deleteMany({
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
export async function deleteAllNotificationsForUser(userId: string): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: { recipients: { some: { userId } } },
  });
  return result.count;
}
