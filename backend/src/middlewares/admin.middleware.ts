import { Response, NextFunction } from "express";
import {
  authenticateJWT,
  AuthRequest,
  requireRole,
} from "./auth.middleware";

/** Alias explícito para validación JWT en rutas administrativas. */
export const authMiddleware = authenticateJWT;

/** Requiere usuario autenticado con rol ADMIN. */
export const requireAdmin = requireRole("ADMIN");

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  authenticateJWT(req, res, (authErr) => {
    if (authErr) return next(authErr);
    requireRole("ADMIN")(req, res, next);
  });
}
