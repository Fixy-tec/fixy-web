import * as applicationsRepository from "../repositories/applications.repository";
import * as notificationsService from "../../notifications/services/notifications.service";
import { ApplicationStatus, RequestStatus } from "@prisma/client";
import prisma from "../../../prisma";

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
    const result = await prisma.$transaction(async (tx) => {
      // Validate capacity within transaction
      const request = await tx.request.findUnique({
        where: { id: application.requestId },
        select: { participantsNeeded: true, status: true },
      });

      if (!request) {
        throw new Error("Request not found");
      }

      const acceptedCount = await tx.application.count({
        where: {
          requestId: application.requestId,
          status: "ACEPTADA",
        },
      });

      if (acceptedCount >= request.participantsNeeded) {
        throw new Error("This request has reached the maximum number of participants");
      }

      // Update application
      const updatedApp = await tx.application.update({
        where: { id },
        data: { status: input.status, message: input.message },
        include: {
          request: { include: { creator: { include: { profile: true } } } },
          applicant: { include: { profile: true } },
        },
      });

      // Check if we need to update request status after acceptance
      const newAcceptedCount = acceptedCount + 1;
      if (newAcceptedCount >= request.participantsNeeded && (request.status === "ABIERTA" || request.status === "EN_REVISION")) {
        await tx.request.update({
          where: { id: application.requestId },
          data: { status: "EN_PROCESO" },
        });
      }

      return updatedApp;
    });

    // Notif al aplicante: "te aceptaron".
    void notificationsService.notifyApplicationAccepted({
      applicantId: result.applicantId,
      requestTitle: result.request.title,
      requestId: result.requestId,
      applicationId: result.id,
    });

    return result;
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

  return applicationsRepository.deleteApplication(id);
}
