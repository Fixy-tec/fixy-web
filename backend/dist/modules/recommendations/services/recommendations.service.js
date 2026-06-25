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
exports.getRecommendedRequests = getRecommendedRequests;
exports.getRecommendedApplicants = getRecommendedApplicants;
exports.getMatchPercentage = getMatchPercentage;
exports.verifyRequestOwnership = verifyRequestOwnership;
const recommendationsRepository = __importStar(require("../repositories/recommendations.repository"));
const prisma_1 = __importDefault(require("../../../prisma"));
async function getRecommendedRequests(userId, limit = 10) {
    if (!userId) {
        throw new Error("UserId is required");
    }
    return recommendationsRepository.getRecommendedRequestsForUser(userId, limit);
}
async function getRecommendedApplicants(requestId) {
    if (!requestId) {
        throw new Error("RequestId is required");
    }
    return recommendationsRepository.getRecommendedApplicantsForRequest(requestId);
}
async function getMatchPercentage(userId, requestId) {
    if (!userId || !requestId) {
        throw new Error("UserId and RequestId are required");
    }
    return recommendationsRepository.calculateMatchPercentage(userId, requestId);
}
/**
 * Verify that a user owns a request
 * Used for authorization checks on sensitive endpoints
 */
async function verifyRequestOwnership(requestId, userId) {
    try {
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
            select: { creatorId: true },
        });
        return request?.creatorId === userId;
    }
    catch (error) {
        return false;
    }
}
