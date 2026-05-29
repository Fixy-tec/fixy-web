"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const applications_controller_1 = require("../modules/applications/controllers/applications.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/", applications_controller_1.getApplications);
router.get("/:id", applications_controller_1.getApplicationById);
// Protected routes
router.post("/", auth_middleware_1.authenticateJWT, applications_controller_1.createApplication);
router.patch("/:id", auth_middleware_1.authenticateJWT, applications_controller_1.updateApplication);
router.delete("/:id", auth_middleware_1.authenticateJWT, applications_controller_1.deleteApplication);
exports.default = router;
