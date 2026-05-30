"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const request_controller_1 = require("../modules/requests/controllers/request.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/", request_controller_1.getRequests);
router.get("/:id", request_controller_1.getRequestById);
// Protected routes
router.post("/", auth_middleware_1.authenticateJWT, request_controller_1.createRequest);
router.patch("/:id", auth_middleware_1.authenticateJWT, request_controller_1.updateRequest);
router.delete("/:id", auth_middleware_1.authenticateJWT, request_controller_1.deleteRequest);
router.post("/:id/extend-deadline", auth_middleware_1.authenticateJWT, request_controller_1.extendDeadline);
exports.default = router;
