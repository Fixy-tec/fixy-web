import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password and name are required" });
    }

    const result = await authService.register({ email, password, name });
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Registration failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await authService.login({ email, password });
    return res.json(result);
  } catch (error: any) {
    return res.status(401).json({ message: error.message || "Invalid credentials" });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    return res.json({ message: "Logout successful" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Logout failed" });
  }
}
