import * as applicationsRepository from "../repositories/applications.repository";
import * as notificationsService from "../../notifications/services/notifications.service";
import { ApplicationStatus, Prisma } from "@prisma/client";
import prisma from "../../../prisma";
import { notifyAdminDashboardUpdate } from "../../../realtime/admin.realtime";
import {
  FREE_LIMITS,
  isProActive,
  PlanLimitError,
} from "../../plans/plan.utils";

/** Asesoría con monto: se paga por adelantado y queda en garantía. */
export function requiresEscrow(request: {
  type: string;
  economicBenefit: number | null;
}): boolean {
  return request.type === "ASESORIA" && (request.economicBenefit ?? 0) > 0;
}

export class PaymentRequiredError extends Error {
  readonly code = "PAYMENT_REQUIRED";
  constructor() {
    super(
      "Esta asesoría tiene un pago: para aceptar al postulante debes pagar primero. El dinero queda en garantía hasta que ambos se califiquen.",
    );
    this.name = "PaymentRequiredError";
  }
}

const acceptedApplicationInclude = {
  request: { include: { creator: { include: { profile: true } } } },
  applicant: { include: { profile: true } },
} satisfies Prisma.ApplicationInclude;

/**
 * Acepta una postulación dentro de una transacción ya abierta: valida cupo,
 * marca la postulación como ACEPTADA y pasa el request a EN_PROCESO cuando
 * se llena el cupo. La usa tanto el flujo normal como el pago en garantía.
 */
export async function acceptApplicationInTx(
  tx: Prisma.TransactionClient,
  applicationId: string,
  message?: string,
) {
  const application = await tx.application.findUnique({
    where: { id: applicationId },
    select: { id: true, requestId: true, status: true },
  });
  if (!application) {
    throw new Error("Application not found");
  }
  if (application.status === "ACEPTADA") {
    throw new Error("Esta postulación ya fue aceptada");
  }

  const request = await tx.request.findUnique({
    where: { id: application.requestId },
    select: { participantsNeeded: true, status: true },
  });
  if (!request) {
    throw new Error("Request not found");
  }
  if (request.status !== "ABIERTA" && request.status !== "EN_REVISION") {
    throw new Error("La solicitud ya no acepta postulantes");
  }

  const acceptedCount = await tx.application.count({
    where: { requestId: application.requestId, status: "ACEPTADA" },
  });
  if (acceptedCount >= request.participantsNeeded) {
    throw new Error("This request has reached the maximum number of participants");
  }

  const updatedApp = await tx.application.update({
    where: { id: applicationId },
    data: { status: "ACEPTADA", message },
    include: acceptedApplicationInclude,
  });

  if (acceptedCount + 1 >= request.participantsNeeded) {
    await tx.request.update({
      where: { id: application.requestId },
      data: { status: "EN_PROCESO" },
    });
  }

  return updatedApp;
}

/** Notificaciones posteriores a una aceptación (fuera de la transacción). */
export function notifyAcceptance(app: {
  id: string;
  applicantId: string;
  requestId: string;
  request: { title: string };
}) {
  void notificationsService.notifyApplicationAccepted({
    applicantId: app.applicantId,
    requestTitle: app.request.title,
    requestId: app.requestId,
    applicationId: app.id,
  });
  void notifyAdminDashboardUpdate();
}

interface CreateApplicationInput {
  requestId: string;
  applicantId: string;
  message: string;
}

interface UpdateApplicationInput {
  status?: ApplicationStatus;
  message?: string;
}

export async function createApplication(input: CreateApplicationInput) {
  if (!input.requestId || !input.applicantId || !input.message) {
    throw new Error("RequestId, applicantId and message are required");
  }

  if (input.message.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  // Get request to validate
  const request = await prisma.request.findUnique({
    where: { id: input.requestId },
    select: { id: true, creatorId: true, status: true, participantsNeeded: true },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  // Validate 1: Prevent self-application
  if (input.applicantId === request.creatorId) {
    throw new Error("You cannot apply to your own request");
  }

  // Validate 2: Only allow applications when the request is still open
  // (ABIERTA o EN_REVISION). Cuando el creador acepta los aceptados que
  // necesita, el estado pasa a EN_PROCESO y las nuevas postulaciones se cierran
  // automáticamente sin importar cuántos postulantes haya.
  if (
    request.status !== "ABIERTA" &&
    request.status !== "EN_REVISION"
  ) {
    throw new Error("Applications are only accepted for open requests");
  }

  // Check if already applied
  const existing = await applicationsRepository.getApplicationByRequestAndApplicant(
    input.requestId,
    input.applicantId
  );

  if (existing) {
    throw new Error("You have already applied to this request");
  }

  // Plan Free: máximo de postulaciones en los últimos 7 días.
  const applicant = await prisma.user.findUnique({
    where: { id: input.applicantId },
    select: { plan: true, planExpiresAt: true },
  });
  if (applicant && !isProActive(applicant)) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await prisma.application.count({
      where: { applicantId: input.applicantId, createdAt: { gte: weekAgo } },
    });
    if (recent >= FREE_LIMITS.applicationsPerWeek) {
      throw new PlanLimitError(
        `El plan Free permite ${FREE_LIMITS.applicationsPerWeek} postulaciones por semana. Mejora a Pro para postular sin límites.`,
      );
    }
  }

  // NOTA: NO bloqueamos por cantidad de postulantes. El cupo
  // (`participantsNeeded`) solo limita cuántos puede ACEPTAR el creador, no
  // cuántos pueden postularse. Esto permite mantener una bolsa de candidatos.
  const created = await applicationsRepository.createApplication(input);

  // Notificación al creador del request — fire-and-forget (errores no rompen
  // la creación de la postulación).
  const requestWithCreator = await prisma.request.findUnique({
    where: { id: input.requestId },
    select: { id: true, title: true, creatorId: true },
  });
  const applicantUser = await prisma.user.findUnique({
    where: { id: input.applicantId },
    select: { name: true },
  });
  if (requestWithCreator && applicantUser) {
    void notificationsService.notifyApplicationReceived({
      creatorId: requestWithCreator.creatorId,
      applicantName: applicantUser.name,
      requestTitle: requestWithCreator.title,
      requestId: requestWithCreator.id,
      applicationId: created.id,
    });
  }

  void notifyAdminDashboardUpdate();
  return created;
}

export async function getApplications(filters?: {
  requestId?: string;
  applicantId?: string;
  status?: ApplicationStatus;
}) {
  return applicationsRepository.getApplications(filters);
}

export async function getApplicationById(id: string) {
  const application = await applicationsRepository.getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }
  return application;
}

export async function updateApplication(id: string, input: UpdateApplicationInput) {
  const application = await applicationsRepository.getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }

  if (input.message !== undefined && input.message.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  // Use atomic transaction for acceptance to prevent race conditions
  if (input.status === "ACEPTADA" && application.status !== "ACEPTADA") {
    // Una asesoría pagada solo se acepta a través del pago en garantía
    // (POST /payments/escrow/...), nunca con un PATCH directo.
    if (requiresEscrow(application.request)) {
      throw new PaymentRequiredError();
    }

    const result = await prisma.$transaction((tx) =>
      acceptApplicationInTx(tx, id, input.message),
    );

    notifyAcceptance(result);
    return result;
  }

  // Una postulación ya pagada en garantía no puede rechazarse por esta vía.
  if (input.status === "RECHAZADA" && application.status === "ACEPTADA") {
    const held = await prisma.payment.findFirst({
      where: { applicationId: id, status: { in: ["PENDING", "HELD"] } },
      select: { id: true },
    });
    if (held) {
      throw new Error(
        "Esta postulación tiene un pago en garantía; contacta a un administrador",
      );
    }
  }

  // For other status changes, use regular update
  const result = await applicationsRepository.updateApplication(id, input);

  // Notif al aplicante si pasamos a RECHAZADA (desde otro estado distinto).
  if (
    input.status === "RECHAZADA" &&
    application.status !== "RECHAZADA"
  ) {
    const request = await prisma.request.findUnique({
      where: { id: application.requestId },
      select: { id: true, title: true },
    });
    if (request) {
      void notificationsService.notifyApplicationRejected({
        applicantId: application.applicantId,
        requestTitle: request.title,
        requestId: request.id,
        applicationId: application.id,
      });
    }
  }

  return result;
}

export async function deleteApplication(id: string) {
  const application = await applicationsRepository.getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }

  const activePayment = await prisma.payment.findFirst({
    where: { applicationId: id, status: { in: ["PENDING", "HELD"] } },
    select: { id: true },
  });
  if (activePayment) {
    throw new Error(
      "No puedes retirar esta postulación: tiene un pago en garantía o en verificación",
    );
  }

  return applicationsRepository.deleteApplication(id);
}
