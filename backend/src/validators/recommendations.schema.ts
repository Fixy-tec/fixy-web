import { z } from "zod";

/**
 * Validación para query params de getRecommendedRequests
 */
export const getRecommendedRequestsSchema = z.object({
  limit: z.coerce
    .number()
    .int("Limit debe ser un número entero")
    .min(1, "Limit debe ser al menos 1")
    .max(100, "Limit no puede exceder 100")
    .default(10),
});

export type GetRecommendedRequestsQuery = z.infer<
  typeof getRecommendedRequestsSchema
>;
