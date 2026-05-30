"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../modules/users/controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get("/me", auth_middleware_1.authenticateJWT, user_controller_1.getCurrentUser);
router.patch("/me", auth_middleware_1.authenticateJWT, user_controller_1.updateCurrentUser);
// IMPORTANTE: `/ranking` debe ir antes de `/:id` para no chocar contra
// el handler dinámico de Express.
router.get("/ranking", auth_middleware_1.authenticateJWT, user_controller_1.getRanking);
router.get("/", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)("ADMIN"), user_controller_1.getUsers);
router.get("/:id", auth_middleware_1.authenticateJWT, user_controller_1.getUserById);
exports.default = router;
