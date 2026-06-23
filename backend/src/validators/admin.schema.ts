import { z } from "zod";
import { Role } from "@prisma/client";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.nativeEnum(Role).optional(),
  search: z.string().trim().optional(),
});

export const listLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  action: z.string().trim().optional(),
  adminId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListLogsQuery = z.infer<typeof listLogsQuerySchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
