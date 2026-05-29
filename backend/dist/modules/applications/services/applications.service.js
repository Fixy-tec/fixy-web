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
exports.createApplication = createApplication;
exports.getApplications = getApplications;
exports.getApplicationById = getApplicationById;
exports.updateApplication = updateApplication;
exports.deleteApplication = deleteApplication;
const applicationsRepository = __importStar(require("../repositories/applications.repository"));
const prisma_1 = __importDefault(require("../../../prisma"));
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
    // Validate 2: Only allow applications to ABIERTA requests
    if (request.status !== "ABIERTA" &&
        request.status !== "EN_REVISION") {
        throw new Error("Applications are only accepted for open requests");
    }
    // Check if already applied
    const existing = await applicationsRepository.getApplicationByRequestAndApplicant(input.requestId, input.applicantId);
    if (existing) {
        throw new Error("You have already applied to this request");
    }
    // Validate 3: Check capacity (don't exceed participantsNeeded)
    const acceptedCount = await applicationsRepository.getAcceptedApplicationsCount(input.requestId);
    if (acceptedCount >= request.participantsNeeded) {
        throw new Error("This request has reached the maximum number of participants");
    }
    return applicationsRepository.createApplication(input);
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
        const result = await prisma_1.default.$transaction(async (tx) => {
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
        return result;
    }
    // For other status changes, use regular update
    const result = await applicationsRepository.updateApplication(id, input);
    return result;
}
async function deleteApplication(id) {
    const application = await applicationsRepository.getApplicationById(id);
    if (!application) {
        throw new Error("Application not found");
    }
    return applicationsRepository.deleteApplication(id);
}
