"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRating = createRating;
exports.getRating = getRating;
exports.getRatingsByApplicationId = getRatingsByApplicationId;
exports.getRatingsByRatedUser = getRatingsByRatedUser;
exports.updateRating = updateRating;
exports.deleteRating = deleteRating;
exports.getApplicationForRating = getApplicationForRating;
exports.getRatingsByApplication = getRatingsByApplication;
exports.getRatingByApplicationAndRater = getRatingByApplicationAndRater;
const prisma_1 = __importDefault(require("../../../prisma"));
async function createRating(data) {
    return prisma_1.default.rating.create({
        data: {
            applicationId: data.applicationId,
            raterId: data.raterId,
            ratedId: data.ratedId,
            stars: data.stars,
            comment: data.comment,
        },
        include: {
            rater: { include: { profile: true } },
            rated: { include: { profile: true } },
            application: {
                include: {
                    request: true,
                    applicant: { include: { profile: true } },
                },
            },
        },
    });
}
async function getRating(id) {
    return prisma_1.default.rating.findUnique({
        where: { id },
        include: {
            rater: { include: { profile: true } },
            rated: { include: { profile: true } },
            application: {
                include: {
                    request: true,
                    applicant: { include: { profile: true } },
                },
            },
        },
    });
}
async function getRatingsByApplicationId(applicationId) {
    return prisma_1.default.rating.findMany({
        where: { applicationId },
        include: {
            rater: true,
            rated: true,
        },
    });
}
async function getRatingsByRatedUser(userId) {
    return prisma_1.default.rating.findMany({
        where: { ratedId: userId },
        include: {
            rater: { include: { profile: true } },
            application: {
                include: {
                    request: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
async function updateRating(id, data) {
    const updateData = {
        stars: data.stars,
        comment: data.comment,
    };
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);
    return prisma_1.default.rating.update({
        where: { id },
        data: updateData,
        include: {
            rater: { include: { profile: true } },
            rated: { include: { profile: true } },
            application: {
                include: {
                    request: true,
                    applicant: { include: { profile: true } },
                },
            },
        },
    });
}
async function deleteRating(id) {
    return prisma_1.default.rating.delete({
        where: { id },
    });
}
async function getApplicationForRating(applicationId) {
    return prisma_1.default.application.findUnique({
        where: { id: applicationId },
        include: {
            request: {
                include: { creator: true },
            },
        },
    });
}
async function getRatingsByApplication(applicationId) {
    return prisma_1.default.rating.findMany({
        where: { applicationId },
    });
}
async function getRatingByApplicationAndRater(applicationId, raterId) {
    return prisma_1.default.rating.findFirst({
        where: {
            applicationId,
            raterId,
        },
    });
}
