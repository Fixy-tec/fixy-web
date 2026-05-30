"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequest = createRequest;
exports.getRequests = getRequests;
exports.getRequestById = getRequestById;
exports.updateRequest = updateRequest;
exports.deleteRequest = deleteRequest;
exports.getUserRequestCount = getUserRequestCount;
const prisma_1 = __importDefault(require("../../../prisma"));
async function createRequest(data) {
    return prisma_1.default.request.create({
        data: {
            creatorId: data.creatorId,
            type: data.type,
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            basePoints: data.basePoints,
            economicBenefit: data.economicBenefit,
            participantsNeeded: data.participantsNeeded,
            deadline: data.deadline,
            tags: {
                create: data.tagIds.map((tagId) => ({
                    tag: { connect: { id: tagId } },
                })),
            },
        },
        include: {
            creator: { include: { profile: true } },
            tags: { include: { tag: true } },
            applications: true,
        },
    });
}
async function getRequests(filters) {
    return prisma_1.default.request.findMany({
        where: {
            type: filters?.type,
            status: filters?.status,
            creatorId: filters?.creatorId,
        },
        include: {
            creator: { include: { profile: true } },
            tags: { include: { tag: true } },
            applications: true,
        },
        orderBy: { createdAt: "desc" },
    });
}
async function getRequestById(id) {
    return prisma_1.default.request.findUnique({
        where: { id },
        include: {
            creator: { include: { profile: true } },
            tags: { include: { tag: true } },
            applications: {
                // `ratings: true` permite al frontend saber quién ya calificó a quién
                // (raterId === currentUserId) sin hacer un round-trip extra.
                include: {
                    applicant: { include: { profile: true } },
                    ratings: true,
                },
            },
        },
    });
}
async function updateRequest(id, data) {
    const updateData = {
        type: data.type,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        basePoints: data.basePoints,
        economicBenefit: data.economicBenefit,
        participantsNeeded: data.participantsNeeded,
        deadline: data.deadline,
        status: data.status,
    };
    // Remove undefined fields
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);
    if (data.tagIds !== undefined) {
        updateData.tags = {
            deleteMany: {},
            create: data.tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
            })),
        };
    }
    return prisma_1.default.request.update({
        where: { id },
        data: updateData,
        include: {
            creator: { include: { profile: true } },
            tags: { include: { tag: true } },
            applications: true,
        },
    });
}
async function deleteRequest(id) {
    // Limpiamos las dependencias que no tienen ON DELETE CASCADE en el schema
    // antes de borrar el Request, para evitar errores de FK
    // (RequestTag_requestId_fkey, PointLog_requestId_fkey).
    // Las Applications y Ratings sí tienen cascade, por lo que se borran solas.
    return prisma_1.default.$transaction(async (tx) => {
        await tx.requestTag.deleteMany({ where: { requestId: id } });
        await tx.pointLog.updateMany({
            where: { requestId: id },
            data: { requestId: null },
        });
        return tx.request.delete({ where: { id } });
    });
}
async function getUserRequestCount(userId) {
    return prisma_1.default.request.count({
        where: {
            creatorId: userId,
            status: {
                in: ["ABIERTA", "EN_REVISION", "EN_PROCESO"],
            },
        },
    });
}
