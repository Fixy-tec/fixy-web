"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApplication = createApplication;
exports.getApplications = getApplications;
exports.getApplicationById = getApplicationById;
exports.updateApplication = updateApplication;
exports.deleteApplication = deleteApplication;
const applicationsService = __importStar(require("../services/applications.service"));
const client_1 = require("@prisma/client");
async function createApplication(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { requestId, message } = req.body;
        if (!requestId || !message) {
            return res.status(400).json({ message: "RequestId and message are required" });
        }
        const result = await applicationsService.createApplication({
            requestId,
            applicantId: userId,
            message,
        });
        return res.status(201).json(result);
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to create application" });
    }
}
async function getApplications(req, res) {
    try {
        const { requestId, applicantId, status } = req.query;
        const filters = {};
        if (requestId) {
            filters.requestId = requestId;
        }
        if (applicantId) {
            filters.applicantId = applicantId;
        }
        if (status && Object.values(client_1.ApplicationStatus).includes(status)) {
            filters.status = status;
        }
        const applications = await applicationsService.getApplications(filters);
        return res.json({ applications });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to get applications" });
    }
}
async function getApplicationById(req, res) {
    try {
        const { id } = req.params;
        const application = await applicationsService.getApplicationById(id);
        return res.json({ application });
    }
    catch (error) {
        return res.status(404).json({ message: error.message || "Application not found" });
    }
}
async function updateApplication(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const { status, message } = req.body;
        const application = await applicationsService.getApplicationById(id);
        // Only the request creator can update status, applicant can update message
        if (status && application.request.creatorId !== userId) {
            return res.status(403).json({ message: "Only the request creator can update status" });
        }
        if (message && application.applicantId !== userId) {
            return res.status(403).json({ message: "You can only update your own applications" });
        }
        const result = await applicationsService.updateApplication(id, { status, message });
        return res.json(result);
    }
    catch (error) {
        // Handle specific error for capacity
        if (error.message.includes("reached the maximum number of participants")) {
            return res.status(409).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message || "Failed to update application" });
    }
}
async function deleteApplication(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const application = await applicationsService.getApplicationById(id);
        // Only applicant or request creator can delete
        if (application.applicantId !== userId && application.request.creatorId !== userId) {
            return res.status(403).json({ message: "You can only delete your own applications" });
        }
        await applicationsService.deleteApplication(id);
        return res.json({ message: "Application deleted successfully" });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to delete application" });
    }
}
