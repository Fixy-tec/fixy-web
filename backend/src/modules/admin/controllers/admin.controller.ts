import { Request, Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import {
  listUsersQuerySchema,
  listLogsQuerySchema,
  updateUserRoleSchema,
} from "../../../validators/admin.schema";
import * as adminService from "../services/admin.service";
import {
  ActiveAcademicProcessError,
  RootAdminDeleteError,
  SelfRoleChangeError,
  UserNotFoundError,
} from "../services/admin.service";

export async function listUsers(req: Request, res: Response) {
  try {
    const validated = listUsersQuerySchema.parse(req.query);
    const result = await adminService.listUsers(validated);
    return res.json(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message || "Parámetros de consulta inválidos",
      });
    }
    console.error("[GET /api/admin/users]", error);
    return res.status(500).json({ message: "Error al listar usuarios" });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const adminId = authReq.user?.userId;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const validated = updateUserRoleSchema.parse(req.body);
    const user = await adminService.changeUserRole(
      adminId,
      id,
      validated.role,
    );
    return res.json({ user });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message || "Datos inválidos",
      });
    }
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    if (
      error instanceof ActiveAcademicProcessError ||
      error instanceof SelfRoleChangeError
    ) {
      return res.status(409).json({ message: error.message });
    }
    console.error("[PATCH /api/admin/users/:id/role]", error);
    return res.status(500).json({ message: "Error al cambiar rol" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const adminId = authReq.user?.userId;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const user = await adminService.deleteUser(adminId, id);
    return res.json({ user, message: "Usuario desactivado correctamente" });
  } catch (error: unknown) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    if (
      error instanceof ActiveAcademicProcessError ||
      error instanceof RootAdminDeleteError
    ) {
      return res.status(409).json({ message: error.message });
    }
    console.error("[DELETE /api/admin/users/:id]", error);
    return res.status(500).json({ message: "Error al eliminar usuario" });
  }
}

export async function getDashboard(req: Request, res: Response) {
  try {
    const dashboard = await adminService.getDashboard();
    return res.json(dashboard);
  } catch (error: unknown) {
    console.error("[GET /api/admin/dashboard]", error);
    return res.status(500).json({ message: "Error al obtener dashboard" });
  }
}

export async function listLogs(req: Request, res: Response) {
  try {
    const validated = listLogsQuerySchema.parse(req.query);
    const result = await adminService.listLogs(validated);
    return res.json(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message || "Parámetros de consulta inválidos",
      });
    }
    console.error("[GET /api/admin/logs]", error);
    return res.status(500).json({ message: "Error al listar logs" });
  }
}
