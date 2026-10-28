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
exports.PaymentRequiredError = void 0;
exports.requiresEscrow = requiresEscrow;
exports.acceptApplicationInTx = acceptApplicationInTx;
exports.notifyAcceptance = notifyAcceptance;
exports.createApplication = createApplication;
exports.getApplications = getApplications;
exports.getApplicationById = getApplicationById;
exports.updateApplication = updateApplication;
exports.deleteApplication = deleteApplication;
const applicationsRepository = __importStar(require("../repositories/applications.repository"));
const notificationsService = __importStar(require("../../notifications/services/notifications.service"));
const prisma_1 = __importDefault(require("../../../prisma"));
const admin_realtime_1 = require("../../../realtime/admin.realtime");
const plan_utils_1 = require("../../plans/plan.utils");
/** Asesoría con monto: se paga por adelantado y queda en garantía. */
function requiresEscrow(request) {
    return request.type === "ASESORIA" && (request.economicBenefit ?? 0) > 0;
}
class PaymentRequiredError extends Error {
    constructor() {
        super("Esta asesoría tiene un pago: para aceptar al postulante debes pagar primero. El dinero queda en garantía hasta que ambos se califiquen.");
        this.code = "PAYMENT_REQUIRED";
        this.name = "PaymentRequiredError";
    }
}
exports.PaymentRequiredError = PaymentRequiredError;
const acceptedApplicationInclude = {
    request: { include: { creator: { include: { profile: true } } } },
    applicant: { include: { profile: true } },
};
/**
 * Acepta una postulación dentro de una transacción ya abierta: valida cupo,
 * marca la postulación como ACEPTADA y pasa el request a EN_PROCESO cuando
 * se llena el cupo. La usa tanto el flujo normal como el pago en garantía.
 */
async function acceptApplicationInTx(tx, applicationId, message) {
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
function notifyAcceptance(app) {
    void notificationsService.notifyApplicationAccepted({
        applicantId: app.applicantId,
        requestTitle: app.request.title,
        requestId: app.requestId,
        applicationId: app.id,
    });
    void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
}
async function createApplication(input) {
    if (!input.requestId || !input.applicantId || !input.message) {
        throw new Error("RequestId, applicantId and message are required");
    }
    if (input.message.trim().length === 0) {
        throw new Error("Message cannot be empty");
    }
    // Get request to validate
    const request = await prisma_1.default.request.findUnique({
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
    if (request.status !== "ABIERTA" &&
        request.status !== "EN_REVISION") {
        throw new Error("Applications are only accepted for open requests");
    }
    // Check if already applied
    const existing = await applicationsRepository.getApplicationByRequestAndApplicant(input.requestId, input.applicantId);
    if (existing) {
        throw new Error("You have already applied to this request");
    }
    // Plan Free: máximo de postulaciones en los últimos 7 días.
    const applicant = await prisma_1.default.user.findUnique({
        where: { id: input.applicantId },
        select: { plan: true, planExpiresAt: true },
    });
    if (applicant && !(0, plan_utils_1.isProActive)(applicant)) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recent = await prisma_1.default.application.count({
            where: { applicantId: input.applicantId, createdAt: { gte: weekAgo } },
        });
        if (recent >= plan_utils_1.FREE_LIMITS.applicationsPerWeek) {
            throw new plan_utils_1.PlanLimitError(`El plan Free permite ${plan_utils_1.FREE_LIMITS.applicationsPerWeek} postulaciones por semana. Mejora a Pro para postular sin límites.`);
        }
    }
    // NOTA: NO bloqueamos por cantidad de postulantes. El cupo
    // (`participantsNeeded`) solo limita cuántos puede ACEPTAR el creador, no
    // cuántos pueden postularse. Esto permite mantener una bolsa de candidatos.
    const created = await applicationsRepository.createApplication(input);
    // Notificación al creador del request — fire-and-forget (errores no rompen
    // la creación de la postulación).
    const requestWithCreator = await prisma_1.default.request.findUnique({
        where: { id: input.requestId },
        select: { id: true, title: true, creatorId: true },
    });
    const applicantUser = await prisma_1.default.user.findUnique({
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
    void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    return created;
}
async function getApplications(filters) {
    return applicationsRepository.getApplications(filters);
}
async function getApplicationById(id) {
    const application = await applicationsRepository.getApplicationById(id);
    if (!application) {
        throw new Error("Application not found");
    }
    return application;
}
async function updateApplication(id, input) {
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
        const result = await prisma_1.default.$transaction((tx) => acceptApplicationInTx(tx, id, input.message));
        notifyAcceptance(result);
        return result;
    }
    // Una postulación ya pagada en garantía no puede rechazarse por esta vía.
    if (input.status === "RECHAZADA" && application.status === "ACEPTADA") {
        const held = await prisma_1.default.payment.findFirst({
            where: { applicationId: id, status: { in: ["PENDING", "HELD"] } },
            select: { id: true },
        });
        if (held) {
            throw new Error("Esta postulación tiene un pago en garantía; contacta a un administrador");
        }
    }
    // For other status changes, use regular update
    const result = await applicationsRepository.updateApplication(id, input);
    // Notif al aplicante si pasamos a RECHAZADA (desde otro estado distinto).
    if (input.status === "RECHAZADA" &&
        application.status !== "RECHAZADA") {
        const request = await prisma_1.default.request.findUnique({
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
async function deleteApplication(id) {
    const application = await applicationsRepository.getApplicationById(id);
    if (!application) {
        throw new Error("Application not found");
    }
    const activePayment = await prisma_1.default.payment.findFirst({
        where: { applicationId: id, status: { in: ["PENDING", "HELD"] } },
        select: { id: true },
    });
    if (activePayment) {
        throw new Error("No puedes retirar esta postulación: tiene un pago en garantía o en verificación");
    }
    return applicationsRepository.deleteApplication(id);
}
