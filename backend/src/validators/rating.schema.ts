import { z } from "zod";

export const createRatingSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  stars: z
    .number()
    .int("Stars must be an integer")
    .min(1, "Stars must be at least 1")
    .max(5, "Stars must be at most 5"),
  comment: z.string().max(1000, "Comment must be at most 1000 characters").optional(),
});

export const updateRatingSchema = z.object({
  stars: z
    .number()
    .int("Stars must be an integer")
    .min(1, "Stars must be at least 1")
    .max(5, "Stars must be at most 5")
    .optional(),
  comment: z.string().max(1000, "Comment must be at most 1000 characters").optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type UpdateRatingInput = z.infer<typeof updateRatingSchema>;
