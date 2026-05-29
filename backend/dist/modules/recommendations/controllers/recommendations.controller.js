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
exports.getRecommendedRequests = getRecommendedRequests;
exports.getRecommendedApplicants = getRecommendedApplicants;
exports.getMatchPercentage = getMatchPercentage;
const recommendationsService = __importStar(require("../services/recommendations.service"));
async function getRecommendedRequests(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const limit = parseInt(req.query.limit) || 10;
        const recommendations = await recommendationsService.getRecommendedRequests(userId, limit);
        return res.json({ recommendations });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to get recommendations" });
    }
}
async function getRecommendedApplicants(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { requestId } = req.params;
        // Verify user owns the request
        // This should be done in a service, but for now verify here
        const applicants = await recommendationsService.getRecommendedApplicants(requestId);
        return res.json({ applicants });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to get recommended applicants" });
    }
}
async function getMatchPercentage(req, res) {
    try {
        const { userId, requestId } = req.params;
        const matchPercentage = await recommendationsService.getMatchPercentage(userId, requestId);
        return res.json({ matchPercentage });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Failed to calculate match" });
    }
}
