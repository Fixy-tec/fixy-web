import { Request, Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as authService from "../services/auth.service";
import { loginSchema, registerSchema } from "../../../validators/auth.schema";

export async function register(req: Request, res: Response) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.registerWithPassword(input);
    return res.status(201).json(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message ?? "Datos inválidos" });
    }
    if (
      error instanceof authService.EmailTakenError ||
      error instanceof authService.UsernameTakenError
    ) {
      return res.status(409).json({ message: error.message });
    }
    console.error("[POST /auth/register]", error);
    return res.status(500).json({ message: "No se pudo crear la cuenta" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.loginWithPassword(input);
    return res.json(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message ?? "Datos inválidos" });
    }
    if (error instanceof authService.InvalidCredentialsError) {
      return res.status(401).json({ message: error.message });
    }
    if (error instanceof authService.GoogleOnlyAccountError) {
      return res.status(400).json({ message: error.message, code: "GOOGLE_ONLY_ACCOUNT" });
    }
    if (error instanceof authService.AccountDisabledError) {
      return res.status(403).json({ message: error.message, code: "ACCOUNT_DISABLED" });
    }
    console.error("[POST /auth/login]", error);
    return res.status(500).json({ message: "No se pudo iniciar sesión" });
  }
}

export async function googleLogin(_req: Request, res: Response) {
  try {
    const url = authService.getGoogleAuthUrl();
    return res.redirect(url);
  } catch (error: unknown) {
    console.error("[GET /auth/google]", error);
    return res.status(500).json({
      message: "Google OAuth no está configurado correctamente",
    });
  }
}

export async function googleCallback(req: Request, res: Response) {
  try {
    const code =
      typeof req.body?.code === "string"
        ? req.body.code
        : typeof req.query.code === "string"
          ? req.query.code
          : null;

    if (!code) {
      return res.status(400).json({ message: "Código de autorización requerido" });
    }

    const result = await authService.handleGoogleCallback(code);
    return res.json(result);
  } catch (error: unknown) {
    if (error instanceof authService.AccountDisabledError) {
      return res.status(403).json({ message: error.message, code: "ACCOUNT_DISABLED" });
    }
    if (error instanceof authService.GoogleAuthError) {
      return res.status(401).json({ message: error.message, code: "GOOGLE_AUTH_FAILED" });
    }
    console.error("[POST /auth/google/callback]", error);
    return res.status(500).json({ message: "Error al procesar autenticación con Google" });
  }
}

export async function logout(_req: Request, res: Response) {
  return res.json({ message: "Logout successful" });
}

export async function me(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await authService.validateSession(userId);
  if (!user) {
    return res.status(401).json({ message: "Sesión inválida" });
  }

  return res.json({ user });
}
