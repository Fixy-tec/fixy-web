"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRatingSchema = exports.createRatingSchema = void 0;
const zod_1 = require("zod");
exports.createRatingSchema = zod_1.z.object({
    applicationId: zod_1.z.string().min(1, "Application ID is required"),
    stars: zod_1.z
        .number()
        .int("Stars must be an integer")
        .min(1, "Stars must be at least 1")
        .max(5, "Stars must be at most 5"),
    comment: zod_1.z.string().max(1000, "Comment must be at most 1000 characters").optional(),
});
exports.updateRatingSchema = zod_1.z.object({
    stars: zod_1.z
        .number()
        .int("Stars must be an integer")
        .min(1, "Stars must be at least 1")
        .max(5, "Stars must be at most 5")
        .optional(),
    comment: zod_1.z.string().max(1000, "Comment must be at most 1000 characters").optional(),
});
