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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRating = createRating;
exports.getRating = getRating;
exports.getRatingsByUser = getRatingsByUser;
exports.updateRating = updateRating;
exports.deleteRating = deleteRating;
exports.createApplicantRating = createApplicantRating;
const ratingsService = __importStar(require("../services/ratings.service"));
const rating_schema_1 = require("../../../validators/rating.schema");
const zod_1 = require("zod");
async function createRating(req, res) {
    try {
        const authReq = req;
        const raterId = authReq.user?.userId;
        if (!raterId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Validate input
        const validatedData = rating_schema_1.createRatingSchema.parse(req.body);
        const result = await ratingsService.createRating({
            applicationId: validatedData.applicationId,
            raterId,
            stars: validatedData.stars,
            comment: validatedData.comment,
        });
        return res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: error.issues[0]?.message || "Validation error",
            });
        }
        return res.status(400).json({ message: error.message || "Failed to create rating" });
    }
}
async function getRating(req, res) {
    try {
        const { id } = req.params;
        const rating = await ratingsService.getRating(id);
        return res.json({ rating });
    }
    catch (error) {
        return res.status(404).json({ message: error.message || "Rating not found" });
    }
}
async function getRatingsByUser(req, res) {
    try {
        const { userId } = req.params;
        const ratings = await ratingsService.getRatingsByRatedUser(userId);
        return res.json({ ratings });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to get ratings" });
    }
}
async function updateRating(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        // Validate input
        const validatedData = rating_schema_1.updateRatingSchema.parse(req.body);
        const result = await ratingsService.updateRating(id, userId, {
            stars: validatedData.stars,
            comment: validatedData.comment,
        });
        return res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: error.issues[0]?.message || "Validation error",
            });
        }
        return res.status(400).json({ message: error.message || "Failed to update rating" });
    }
}
async function deleteRating(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        await ratingsService.deleteRating(id, userId);
        return res.json({ message: "Rating deleted successfully" });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to delete rating" });
    }
}
/**
 * POST /api/ratings/applicant - Crear rating del aplicante al creador
 */
async function createApplicantRating(req, res) {
    try {
        const authReq = req;
        const applicantId = authReq.user?.userId;
        if (!applicantId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Validate input
        const validatedData = rating_schema_1.createRatingSchema.parse(req.body);
        const result = await ratingsService.createApplicantRating({
            applicationId: validatedData.applicationId,
            raterId: applicantId,
            stars: validatedData.stars,
            comment: validatedData.comment,
        });
        return res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: error.issues[0]?.message || "Validation error",
            });
        }
        return res.status(400).json({ message: error.message || "Failed to create rating" });
    }
}
