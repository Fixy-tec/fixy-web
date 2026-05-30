import * as notificationsRepository from "../repositories/notifications.repository";
import { Medal, NotificationType } from "@prisma/client";

const MEDAL_LABEL: Record<Medal, string> = {
  HIERRO: "Hierro",
  BRONCE: "Bronce",
  PLATA: "Plata",
  ORO: "Oro",
  DIAMANTE: "Diamante",
  MAESTRO: "Maestro",
  CHALLENGER: "Challenger",
};

// ── CRUD básico expuesto por el controller ────────────────────────────────

export async function getMyNotifications(userId: string, limit?: number) {
  return notificationsRepository.getUserNotifications(userId, limit);
}

export async function deleteMyNotification(
  notificationId: string,
  userId: string,
) {
  const deleted = await notificationsRepository.deleteNotificationForUser(
    notificationId,
    userId,
  );
  if (!deleted) {
    throw new Error("Notification not found");
  }
}

export async function clearMyNotifications(userId: string) {
  return notificationsRepository.deleteAllNotificationsForUser(userId);
}

// ── Helpers de "trigger" usados desde otros módulos ───────────────────────
//
// Todos los helpers atrapan errores internamente (`.catch`) porque una
// notificación que falla NUNCA debe romper el flujo principal (aceptar una
// postulación, registrar una calificación, etc.). Si falla, se loguea y
// el caller continúa.

function safeCreate(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  return notificationsRepository
    .createNotificationForUser({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data as any,
    })
    .catch((error) => {
      console.error(
        `[notifications] Failed to create '${input.type}' for ${input.userId}:`,
        error,
      );
      return null;
    });
}

export async function notifyApplicationReceived(args: {
  creatorId: string;
  applicantName: string;
  requestTitle: string;
  requestId: string;
  applicationId: string;
}) {
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

export async function notifyApplicationAccepted(args: {
  applicantId: string;
  requestTitle: string;
  requestId: string;
  applicationId: string;
}) {
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

export async function notifyApplicationRejected(args: {
  applicantId: string;
  requestTitle: string;
  requestId: string;
  applicationId: string;
}) {
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
export async function notifyRatingReceived(args: {
  ratedUserId: string;
  raterName: string;
  requestTitle: string;
  requestId: string;
  stars: number;
}) {
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

export async function notifyRankUp(args: {
  userId: string;
  newMedal: Medal;
  previousMedal: Medal;
  newPoints: number;
}) {
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
