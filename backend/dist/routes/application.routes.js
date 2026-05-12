"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const application_controller_1 = require("../controllers/application.controller");
const router = (0, express_1.Router)();
router.get("/", application_controller_1.listApplications);
router.post("/", application_controller_1.createApplication);
exports.default = router;
