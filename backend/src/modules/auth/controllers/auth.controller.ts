import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await authService.register({ email, password });
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
