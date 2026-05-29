"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApplication = createApplication;
exports.getApplications = getApplications;
exports.getApplicationById = getApplicationById;
exports.updateApplication = updateApplication;
exports.deleteApplication = deleteApplication;
exports.getApplicationByRequestAndApplicant = getApplicationByRequestAndApplicant;
exports.getAcceptedApplicationsCount = getAcceptedApplicationsCount;
exports.getAcceptedApplications = getAcceptedApplications;
exports.hasCapacityForMoreApplications = hasCapacityForMoreApplications;
const prisma_1 = __importDefault(require("../../../prisma"));
async function createApplication(data) {
    return prisma_1.default.application.create({
        data: {
            requestId: data.requestId,
            applicantId: data.applicantId,
            message: data.message,
            status: "PENDIENTE",
        },
        include: {
            request: { include: { creator: { include: { profile: true } } } },
            applicant: { include: { profile: true } },
        },
    });
}
async function getApplications(filters) {
    return prisma_1.default.application.findMany({
        where: {
            requestId: filters?.requestId,
            applicantId: filters?.applicantId,
            status: filters?.status,
        },
        include: {
            request: { include: { creator: { include: { profile: true } } } },
            applicant: { include: { profile: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}
async function getApplicationById(id) {
    return prisma_1.default.application.findUnique({
        where: { id },
        include: {
            request: { include: { creator: { include: { profile: true } } } },
            applicant: { include: { profile: true } },
            ratings: true,
        },
    });
}
async function updateApplication(id, data) {
    const updateData = {
        status: data.status,
        message: data.message,
    };
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);
    return prisma_1.default.application.update({
        where: { id },
        data: updateData,
        include: {
            request: { include: { creator: { include: { profile: true } } } },
            applicant: { include: { profile: true } },
        },
    });
}
async function deleteApplication(id) {
    return prisma_1.default.application.delete({
        where: { id },
    });
}
async function getApplicationByRequestAndApplicant(requestId, applicantId) {
    return prisma_1.default.application.findUnique({
        where: {
            requestId_applicantId: {
                requestId,
                applicantId,
            },
        },
    });
}
/**
 * Obtener conteo de aplicaciones aceptadas para un request
 */
async function getAcceptedApplicationsCount(requestId) {
    return prisma_1.default.application.count({
        where: {
            requestId,
            status: "ACEPTADA",
        },
    });
}
/**
 * Obtener todas las aplicaciones aceptadas de un request
 */
async function getAcceptedApplications(requestId) {
    return prisma_1.default.application.findMany({
        where: {
            requestId,
            status: "ACEPTADA",
        },
        include: {
            request: { include: { creator: { include: { profile: true } } } },
            applicant: { include: { profile: true } },
            ratings: true,
        },
    });
}
/**
 * Verificar si un request necesita más aplicantes
 */
async function hasCapacityForMoreApplications(requestId) {
    const request = await prisma_1.default.request.findUnique({
        where: { id: requestId },
        select: { participantsNeeded: true },
    });
    if (!request) {
        throw new Error("Request not found");
    }
    const acceptedCount = await getAcceptedApplicationsCount(requestId);
    return acceptedCount < request.participantsNeeded;
}
