import { Router } from "express";
import { createApplication, listApplications } from "../controllers/application.controller";

const router = Router();
router.get("/", listApplications);
router.post("/", createApplication);

export default router;
