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
exports.createRating = createRating;
exports.getRating = getRating;
exports.getRatingsByRatedUser = getRatingsByRatedUser;
exports.updateRating = updateRating;
exports.deleteRating = deleteRating;
exports.createApplicantRating = createApplicantRating;
const ratingsRepository = __importStar(require("../repositories/ratings.repository"));
const pointlogRepository = __importStar(require("../../pointlog/repositories/pointlog.repository"));
const pointsUtils = __importStar(require("../../../utils/points.utils"));
const prisma_1 = __importDefault(require("../../../prisma"));
async function createRating(input) {
    if (!input.applicationId || !input.raterId) {
        throw new Error("ApplicationId and raterId are required");
    }
    if (input.stars < 1 || input.stars > 5) {
        throw new Error("Stars must be between 1 and 5");
    }
    // Verify application exists and get the rated user
    const application = await ratingsRepository.getApplicationForRating(input.applicationId);
    if (!application) {
        throw new Error("Application not found");
    }
    // Verify request is COMPLETADA (not just application accepted)
    if (application.request.status !== "COMPLETADA") {
        throw new Error("Can only rate when the request is completed");
    }
    // Verify application is ACEPTADA
    if (application.status !== "ACEPTADA") {
        throw new Error("Can only rate accepted applications");
    }
    // Verify rater is the request creator
    if (application.request.creatorId !== input.raterId) {
        throw new Error("Only the request creator can rate the applicant");
    }
    // Verify this specific rater hasn't rated this application yet (allow mutual ratings)
    const existingRating = await ratingsRepository.getRatingByApplicationAndRater(input.applicationId, input.raterId);
    if (existingRating) {
        throw new Error("You have already rated this applicant");
    }
    // Create rating
    const rating = await ratingsRepository.createRating({
        applicationId: input.applicationId,
        raterId: input.raterId,
        ratedId: application.applicantId,
        stars: input.stars,
        comment: input.comment,
    });
    // Calculate and award points to the applicant (rated user)
    const applicantPoints = pointsUtils.calculateApplicantPoints(application.request.basePoints, input.stars);
    // Update user points and medal
    const applicantUser = await prisma_1.default.user.findUnique({
        where: { id: application.applicantId },
        select: { id: true, points: true, medal: true },
    });
    if (applicantUser) {
        const newPoints = Math.max(0, applicantUser.points + applicantPoints);
        const newMedal = pointsUtils.getMedalByPoints(newPoints);
        // Update user
        await prisma_1.default.user.update({
            where: { id: applicantUser.id },
            data: { points: newPoints, medal: newMedal },
        });
        // Create point log for applicant
        await pointlogRepository.createPointLog({
            userId: applicantUser.id,
            delta: applicantPoints,
            reason: pointsUtils.buildPointLogReason("RATING_RECEIVED", {
                requestTitle: application.request.title,
                stars: input.stars,
                requestId: application.request.id,
            }),
            ratingId: rating.id,
            requestId: application.request.id,
        });
        // Recalculate and update avgRating in profile
        const allReceivedRatings = await ratingsRepository.getRatingsByRatedUser(application.applicantId);
        if (allReceivedRatings.length > 0) {
            const avgRating = allReceivedRatings.reduce((sum, r) => sum + r.stars, 0) / allReceivedRatings.length;
            await prisma_1.default.profile.update({
                where: { userId: application.applicantId },
                data: { avgRating: Math.round(avgRating * 100) / 100 }, // Round to 2 decimals
            });
        }
    }
    return rating;
}
async function getRating(id) {
    const rating = await ratingsRepository.getRating(id);
    if (!rating) {
        throw new Error("Rating not found");
    }
    return rating;
}
async function getRatingsByRatedUser(userId) {
    return ratingsRepository.getRatingsByRatedUser(userId);
}
async function updateRating(id, userId, input) {
    // BLOCKED: Ratings cannot be updated to preserve reputation integrity
    throw new Error("Ratings cannot be modified after creation");
}
async function deleteRating(id, userId) {
    // BLOCKED: Ratings cannot be deleted to preserve reputation integrity
    throw new Error("Ratings cannot be deleted after creation");
}
/**
 * Crear rating del aplicante al creador del request
 */
async function createApplicantRating(input) {
    if (!input.applicationId || !input.raterId) {
        throw new Error("ApplicationId and raterId are required");
    }
    if (input.stars < 1 || input.stars > 5) {
        throw new Error("Stars must be between 1 and 5");
    }
    // Verify application exists
    const application = await ratingsRepository.getApplicationForRating(input.applicationId);
    if (!application) {
        throw new Error("Application not found");
    }
    // Verify request is COMPLETADA (not just application accepted)
    if (application.request.status !== "COMPLETADA") {
        throw new Error("Can only rate when the request is completed");
    }
    // Verify application is ACEPTADA
    if (application.status !== "ACEPTADA") {
        throw new Error("Can only rate accepted applications");
    }
    // Verify rater is the applicant
    if (application.applicantId !== input.raterId) {
        throw new Error("Only the applicant can rate the request creator");
    }
    // Verify rating doesn't already exist from this applicant to creator
    const existingRating = await ratingsRepository.getRatingByApplicationAndRater(input.applicationId, input.raterId);
    if (existingRating) {
        throw new Error("You have already rated this request creator");
    }
    // Create rating
    const rating = await ratingsRepository.createRating({
        applicationId: input.applicationId,
        raterId: input.raterId,
        ratedId: application.request.creatorId,
        stars: input.stars,
        comment: input.comment,
    });
    // Calculate and award points to the creator
    const creatorPoints = pointsUtils.calculateCreatorPoints(application.request.basePoints);
    // Apply rating modifier to creator points
    const ratingModifier = input.stars === 5 ? 1.5 : input.stars === 4 ? 1.2 : input.stars === 3 ? 1 : input.stars === 2 ? -30 : -80;
    const finalCreatorPoints = typeof ratingModifier === "number" && ratingModifier < 1
        ? Math.round(creatorPoints + ratingModifier)
        : Math.round(creatorPoints * ratingModifier);
    // Update creator user points and medal
    const creatorUser = await prisma_1.default.user.findUnique({
        where: { id: application.request.creatorId },
        select: { id: true, points: true, medal: true },
    });
    if (creatorUser) {
        const newPoints = Math.max(0, creatorUser.points + finalCreatorPoints);
        const newMedal = pointsUtils.getMedalByPoints(newPoints);
        // Update user
        await prisma_1.default.user.update({
            where: { id: creatorUser.id },
            data: { points: newPoints, medal: newMedal },
        });
        // Create point log for creator
        await pointlogRepository.createPointLog({
            userId: creatorUser.id,
            delta: finalCreatorPoints,
            reason: pointsUtils.buildPointLogReason("CREATOR_BONUS", {
                requestTitle: application.request.title,
                requestId: application.request.id,
            }),
            ratingId: rating.id,
            requestId: application.request.id,
        });
        // Recalculate and update avgRating in profile
        const allReceivedRatings = await ratingsRepository.getRatingsByRatedUser(application.request.creatorId);
        if (allReceivedRatings.length > 0) {
            const avgRating = allReceivedRatings.reduce((sum, r) => sum + r.stars, 0) / allReceivedRatings.length;
            await prisma_1.default.profile.update({
                where: { userId: application.request.creatorId },
                data: { avgRating: Math.round(avgRating * 100) / 100 }, // Round to 2 decimals
            });
        }
    }
    return rating;
}
