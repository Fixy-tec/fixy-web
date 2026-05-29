"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tag_controller_1 = require("../modules/tags/controllers/tag.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Get all tags (public)
router.get("/", tag_controller_1.getTags);
// Get tag by id (public)
router.get("/:id", tag_controller_1.getTagById);
// Create tag (admin only)
router.post("/", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)("ADMIN"), tag_controller_1.createTag);
// Delete tag (admin only)
router.delete("/:id", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)("ADMIN"), tag_controller_1.deleteTag);
exports.default = router;
