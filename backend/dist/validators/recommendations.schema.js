"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedRequestsSchema = void 0;
const zod_1 = require("zod");
/**
 * Validación para query params de getRecommendedRequests
 */
exports.getRecommendedRequestsSchema = zod_1.z.object({
    limit: zod_1.z.coerce
        .number()
        .int("Limit debe ser un número entero")
        .min(1, "Limit debe ser al menos 1")
        .max(100, "Limit no puede exceder 100")
        .default(10),
});
