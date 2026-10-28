import { Request, Response } from "express";
import * as kpisService from "../services/kpis.service";

export async function getRoi(_req: Request, res: Response) {
  try {
    return res.json(await kpisService.getRoiReport());
  } catch (error) {
    console.error("[GET /admin/kpis/roi]", error);
    return res.status(500).json({ message: "No se pudo calcular el ROI" });
  }
}
