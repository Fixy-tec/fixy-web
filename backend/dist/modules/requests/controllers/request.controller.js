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
exports.createRequest = createRequest;
exports.getRequests = getRequests;
exports.getRequestById = getRequestById;
exports.updateRequest = updateRequest;
exports.deleteRequest = deleteRequest;
const requestsService = __importStar(require("../services/requests.service"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const request_schema_1 = require("../../../validators/request.schema");
async function createRequest(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validatedData = request_schema_1.createRequestSchema.parse(req.body);
        const result = await requestsService.createRequest({
            creatorId: userId,
            type: validatedData.type,
            title: validatedData.title,
            description: validatedData.description,
            difficulty: validatedData.difficulty,
            basePoints: validatedData.basePoints,
            economicBenefit: validatedData.economicBenefit,
            tagIds: validatedData.tags,
            deadline: validatedData.deadline
                ? new Date(validatedData.deadline)
                : undefined,
            participantsNeeded: validatedData.participantsNeeded || 1,
        });
        return res.status(201).json({ request: result });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: error.issues[0]?.message,
            });
        }
        if (error instanceof requestsService.InvalidTagIdsError) {
            return res.status(400).json({ message: error.message });
        }
        return res.status(400).json({
            message: error.message ||
                "Failed to create request",
        });
    }
}
async function getRequests(req, res) {
    try {
        const { type, status, creatorId } = req.query;
        const filters = {};
        if (type && Object.values(client_1.RequestType).includes(type)) {
            filters.type = type;
        }
        if (status && Object.values(client_1.RequestStatus).includes(status)) {
            filters.status = status;
        }
        if (creatorId) {
            filters.creatorId = creatorId;
        }
        const requests = await requestsService.getRequests(filters);
        return res.json({ requests });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to get requests" });
    }
}
async function getRequestById(req, res) {
    try {
        const { id } = req.params;
        const request = await requestsService.getRequestById(id);
        return res.json({ request });
    }
    catch (error) {
        return res.status(404).json({ message: error.message || "Request not found" });
    }
}
async function updateRequest(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const { type, title, description, difficulty, basePoints, economicBenefit, participantsNeeded, deadline, status, tagIds } = req.body;
        // Verify ownership
        const request = await requestsService.getRequestById(id);
        if (request.creatorId !== userId) {
            return res.status(403).json({ message: "You can only update your own requests" });
        }
        const updateData = {
            type,
            title,
            description,
            difficulty,
            basePoints,
            economicBenefit,
            participantsNeeded,
            deadline: deadline ? new Date(deadline) : undefined,
            status,
            tagIds: tagIds ? (Array.isArray(tagIds) ? tagIds : [tagIds]) : undefined,
        };
        const result = await requestsService.updateRequest(id, updateData);
        return res.json({ request: result });
    }
    catch (error) {
        if (error instanceof requestsService.InvalidTagIdsError) {
            return res.status(400).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message || "Failed to update request" });
    }
}
async function deleteRequest(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        // Verify ownership
        const request = await requestsService.getRequestById(id);
        if (request.creatorId !== userId) {
            return res.status(403).json({ message: "You can only delete your own requests" });
        }
        await requestsService.deleteRequest(id);
        return res.json({ message: "Request deleted successfully" });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to delete request" });
    }
}
