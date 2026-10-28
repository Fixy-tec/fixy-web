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
exports.ActiveEscrowError = exports.InvalidTagIdsError = void 0;
exports.createRequest = createRequest;
exports.completeRequest = completeRequest;
exports.expireOverdueRequests = expireOverdueRequests;
exports.getRequests = getRequests;
exports.getRequestById = getRequestById;
exports.extendDeadline = extendDeadline;
exports.updateRequest = updateRequest;
exports.deleteRequest = deleteRequest;
const requestsRepository = __importStar(require("../repositories/requests.repository"));
const tagRepository = __importStar(require("../../tags/repositories/tag.repository"));
const prisma_1 = __importDefault(require("../../../prisma"));
const admin_realtime_1 = require("../../../realtime/admin.realtime");
const notificationsService = __importStar(require("../../notifications/services/notifications.service"));
const plan_utils_1 = require("../../plans/plan.utils");
class InvalidTagIdsError extends Error {
    constructor() {
        super("Uno o más tags no existen en el catálogo");
        this.name = "InvalidTagIdsError";
    }
}
exports.InvalidTagIdsError = InvalidTagIdsError;
async function resolveTagIds(tagIdsOrNames) {
    const unique = [
        ...new Set(tagIdsOrNames.map((id) => id.trim()).filter((id) => id.length > 0)),
    ];
    if (unique.length === 0)
        return [];
    const byId = await tagRepository.findTagsByIds(unique);
    if (byId.length === unique.length) {
        return byId.map((t) => t.id);
    }
    const byName = await tagRepository.findTagsByNames(unique);
    if (byName.length !== unique.length) {
        throw new InvalidTagIdsError();
    }
    return byName.map((t) => t.id);
}
async function createRequest(input) {
    if (!input.title || !input.description) {
        throw new Error("Title and description are required");
    }
    if (input.difficulty < 1 || input.difficulty > 5) {
        throw new Error("Difficulty must be between 1 and 5");
    }
    if (input.basePoints < 0) {
        throw new Error("Base points must be 0 or greater");
    }
    if (input.participantsNeeded < 1) {
        throw new Error("At least 1 participant is required");
    }
    if (!input.tagIds?.length) {
        throw new Error("At least one tag is required");
    }
    // For ASESORIA type, force participantsNeeded to 1
    if (input.type === "ASESORIA" && input.participantsNeeded !== 1) {
        input.participantsNeeded = 1;
    }
    // Plan Free: máximo de solicitudes activas. Pro: ilimitadas y destacadas.
    const creator = await prisma_1.default.user.findUnique({
        where: { id: input.creatorId },
        select: { plan: true, planExpiresAt: true },
    });
    const isPro = creator ? (0, plan_utils_1.isProActive)(creator) : false;
    if (!isPro) {
        const userRequestCount = await requestsRepository.getUserRequestCount(input.creatorId);
        if (userRequestCount >= plan_utils_1.FREE_LIMITS.activeRequests) {
            throw new plan_utils_1.PlanLimitError(`El plan Free permite ${plan_utils_1.FREE_LIMITS.activeRequests} solicitudes activas a la vez. Mejora a Pro para publicar sin límites.`);
        }
    }
    const tagIds = await resolveTagIds(input.tagIds);
    const created = await requestsRepository.createRequest({
        ...input,
        tagIds,
        isFeatured: isPro,
    });
    void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    return created;
}
class ActiveEscrowError extends Error {
    constructor(action) {
        super(`No puedes ${action} esta solicitud: tiene un pago en garantía o en verificación. Si hay un problema, contacta a un administrador.`);
        this.name = "ActiveEscrowError";
    }
}
exports.ActiveEscrowError = ActiveEscrowError;
async function hasActiveEscrow(requestId) {
    const count = await prisma_1.default.payment.count({
        where: {
            status: { in: ["PENDING", "HELD"] },
            application: { requestId },
        },
    });
    return count > 0;
}
/**
 * El creador marca como completada una solicitud en proceso. Habilita las
 * calificaciones mutuas, que a su vez liberan el pago en garantía.
 */
async function completeRequest(id) {
    const request = await requestsRepository.getRequestById(id);
    if (!request) {
        throw new Error("Request not found");
    }
    if (request.status !== "EN_PROCESO") {
        throw new Error("Solo puedes completar una solicitud que está en proceso");
    }
    const updated = await requestsRepository.updateRequest(id, {
        status: "COMPLETADA",
    });
    for (const app of request.applications) {
        if (app.status === "ACEPTADA") {
            void notificationsService.notifyRequestCompleted({
                userId: app.applicantId,
                requestTitle: request.title,
                requestId: request.id,
            });
        }
    }
    void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    return updated;
}
/**
 * Auto-expiración perezosa: cada vez que se lee la lista o un detalle de
 * requests, marcamos como vencidos los que ya superaron su `deadline`:
 *
 *   - ABIERTA / EN_REVISION (sin postulantes aceptados suficientes) → CANCELADA
 *   - EN_PROCESO (con postulantes aceptados) → COMPLETADA (habilita ratings)
 *
 * Es barato (dos updateMany por llamada, transaccional) y no requiere
 * infraestructura de cron. Si en el futuro se quiere precisión a nivel de
 * segundos, se puede agregar un job adicional que llame esta misma función.
 */
async function expireOverdueRequests() {
    const now = new Date();
    const [completed, cancelled] = await prisma_1.default.$transaction([
        prisma_1.default.request.updateMany({
            where: {
                deadline: { lt: now },
                isExpired: false,
                status: { in: ["EN_PROCESO"] },
            },
            data: { status: "COMPLETADA", isExpired: true },
        }),
        prisma_1.default.request.updateMany({
            where: {
                deadline: { lt: now },
                isExpired: false,
                status: { in: ["ABIERTA", "EN_REVISION"] },
            },
            data: { status: "CANCELADA", isExpired: true },
        }),
    ]);
    if (completed.count > 0 || cancelled.count > 0) {
        void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    }
}
async function getRequests(filters) {
    await expireOverdueRequests();
    return requestsRepository.getRequests(filters);
}
async function getRequestById(id) {
    await expireOverdueRequests();
    const request = await requestsRepository.getRequestById(id);
    if (!request) {
        throw new Error("Request not found");
    }
    return request;
}
/**
 * Aplaza el deadline de un request. Solo el dueño puede hacerlo y solo si el
 * request sigue activo (no cancelado ni completado). El nuevo deadline debe ser
 * estrictamente mayor que el actual y posterior a "ahora".
 */
async function extendDeadline(id, newDeadline) {
    const request = await requestsRepository.getRequestById(id);
    if (!request) {
        throw new Error("Request not found");
    }
    if (request.status === "CANCELADA" || request.status === "COMPLETADA") {
        throw new Error("No puedes aplazar una solicitud cancelada o completada");
    }
    if (request.isExpired) {
        throw new Error("Esta solicitud ya venció y no puede aplazarse; crea una nueva");
    }
    const now = new Date();
    if (newDeadline <= now) {
        throw new Error("La nueva fecha debe ser posterior a hoy");
    }
    if (request.deadline && newDeadline <= request.deadline) {
        throw new Error("La nueva fecha debe ser posterior al deadline actual");
    }
    return requestsRepository.updateRequest(id, { deadline: newDeadline });
}
async function updateRequest(id, input) {
    const request = await requestsRepository.getRequestById(id);
    if (!request) {
        throw new Error("Request not found");
    }
    if (input.difficulty !== undefined) {
        if (input.difficulty < 1 || input.difficulty > 5) {
            throw new Error("Difficulty must be between 1 and 5");
        }
    }
    if (input.basePoints !== undefined) {
        if (input.basePoints < 0) {
            throw new Error("Base points must be greater than 0");
        }
    }
    if (input.participantsNeeded !== undefined) {
        if (input.participantsNeeded < 1) {
            throw new Error("At least 1 participant is required");
        }
        // For ASESORIA type, ensure participantsNeeded is 1
        if (request.type === "ASESORIA" && input.participantsNeeded !== 1) {
            input.participantsNeeded = 1;
        }
    }
    let tagIds = undefined;
    if (input.tagIds !== undefined) {
        if (input.tagIds.length === 0) {
            throw new Error("At least one tag is required");
        }
        tagIds = await resolveTagIds(input.tagIds);
    }
    // Con dinero en garantía o en verificación, los términos quedan congelados.
    if (await hasActiveEscrow(id)) {
        throw new ActiveEscrowError("modificar");
    }
    const previousStatus = request.status;
    const updated = await requestsRepository.updateRequest(id, { ...input, tagIds });
    if (input.status !== undefined && input.status !== previousStatus) {
        void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    }
    return updated;
}
async function deleteRequest(id) {
    const request = await requestsRepository.getRequestById(id);
    if (!request) {
        throw new Error("Request not found");
    }
    if (await hasActiveEscrow(id)) {
        throw new ActiveEscrowError("retirar");
    }
    return requestsRepository.deleteRequest(id);
}
