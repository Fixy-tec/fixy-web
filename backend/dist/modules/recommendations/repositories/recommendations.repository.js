"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedRequestsForUser = getRecommendedRequestsForUser;
exports.getRecommendedApplicantsForRequest = getRecommendedApplicantsForRequest;
exports.calculateMatchPercentage = calculateMatchPercentage;
const prisma_1 = __importDefault(require("../../../prisma"));
/**
 * Get recommended requests for a user based on tag matching
 * Recommends requests whose tags overlap with user's tags
 */
async function getRecommendedRequestsForUser(userId, limit = 10) {
    try {
        // Get user's tags
        const userTags = await prisma_1.default.userTag.findMany({
            where: { userId },
            include: { tag: true },
        });
        if (userTags.length === 0) {
            // No tags, return recent OPEN requests
            return prisma_1.default.request.findMany({
                where: {
                    status: "ABIERTA",
                    creatorId: { not: userId },
                },
                include: {
                    creator: { include: { profile: true } },
                    tags: { include: { tag: true } },
                    applications: true,
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            });
        }
        const tagIds = userTags.map((ut) => ut.tagId);
        // Get requests with matching tags, prioritize by match count
        const recommendations = await prisma_1.default.request.findMany({
            where: {
                status: "ABIERTA",
                creatorId: { not: userId },
                tags: {
                    some: {
                        tagId: {
                            in: tagIds,
                        },
                    },
                },
            },
            include: {
                creator: { include: { profile: true } },
                tags: { include: { tag: true } },
                applications: true,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
        // Sort by tag match count (most matches first)
        return recommendations.sort((a, b) => {
            const aMatches = a.tags.filter((t) => tagIds.includes(t.tagId)).length;
            const bMatches = b.tags.filter((t) => tagIds.includes(t.tagId)).length;
            return bMatches - aMatches;
        });
    }
    catch (error) {
        throw new Error("Failed to get recommendations");
    }
}
/**
 * Get recommended users for a request based on tag matching
 * Returns applicants whose tags match the request tags
 */
async function getRecommendedApplicantsForRequest(requestId) {
    try {
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
            include: { tags: { include: { tag: true } } },
        });
        if (!request || request.tags.length === 0) {
            return [];
        }
        const requestTagIds = request.tags.map((rt) => rt.tagId);
        // Get users with matching tags (excluding creator and those who already applied)
        const applicants = await prisma_1.default.user.findMany({
            where: {
                id: { not: request.creatorId },
                NOT: {
                    applications: {
                        some: { requestId },
                    },
                },
                userTags: {
                    some: {
                        tagId: {
                            in: requestTagIds,
                        },
                    },
                },
            },
            include: {
                profile: true,
                userTags: { include: { tag: true } },
            },
            take: 20,
        });
        // Sort by match count
        return applicants.sort((a, b) => {
            const aMatches = a.userTags.filter((ut) => requestTagIds.includes(ut.tagId)).length;
            const bMatches = b.userTags.filter((ut) => requestTagIds.includes(ut.tagId)).length;
            return bMatches - aMatches;
        });
    }
    catch (error) {
        throw new Error("Failed to get recommended applicants");
    }
}
/**
 * Calculate match percentage between a request and a user based on tags
 */
async function calculateMatchPercentage(userId, requestId) {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { userTags: true },
        });
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
            include: { tags: true },
        });
        if (!user || !request || user.userTags.length === 0 || request.tags.length === 0) {
            return 0;
        }
        const userTagIds = user.userTags.map((ut) => ut.tagId);
        const requestTagIds = request.tags.map((rt) => rt.tagId);
        const matches = userTagIds.filter((tagId) => requestTagIds.includes(tagId)).length;
        const totalTags = new Set([...userTagIds, ...requestTagIds]).size;
        return (matches / totalTags) * 100;
    }
    catch (error) {
        throw new Error("Failed to calculate match percentage");
    }
}
