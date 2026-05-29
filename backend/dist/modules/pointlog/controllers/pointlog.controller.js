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
exports.getUserPointHistory = getUserPointHistory;
exports.getUserPointStats = getUserPointStats;
exports.getUserPointHistoryPublic = getUserPointHistoryPublic;
exports.getUserPointStatsPublic = getUserPointStatsPublic;
exports.getPointLogs = getPointLogs;
const pointlogService = __importStar(require("../services/pointlog.service"));
/**
 * GET /api/pointlog/me - Obtener historial de puntos del usuario autenticado
 */
async function getUserPointHistory(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const pointHistory = await pointlogService.getUserPointHistory(userId, limit);
        return res.json({ pointHistory });
    }
    catch (error) {
        return res
            .status(400)
            .json({ message: error.message || "Failed to get point history" });
    }
}
/**
 * GET /api/pointlog/stats - Obtener estadísticas de puntos del usuario autenticado
 */
async function getUserPointStats(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const stats = await pointlogService.getUserPointStats(userId);
        return res.json(stats);
    }
    catch (error) {
        return res
            .status(400)
            .json({ message: error.message || "Failed to get point stats" });
    }
}
/**
 * GET /api/pointlog/user/:userId - Obtener historial de puntos de un usuario (público)
 */
async function getUserPointHistoryPublic(req, res) {
    try {
        const { userId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const pointHistory = await pointlogService.getUserPointHistory(userId, limit);
        return res.json({ pointHistory });
    }
    catch (error) {
        return res
            .status(400)
            .json({ message: error.message || "Failed to get point history" });
    }
}
/**
 * GET /api/pointlog/stats/:userId - Obtener estadísticas de puntos de un usuario (público)
 */
async function getUserPointStatsPublic(req, res) {
    try {
        const { userId } = req.params;
        const stats = await pointlogService.getUserPointStats(userId);
        return res.json(stats);
    }
    catch (error) {
        return res
            .status(400)
            .json({ message: error.message || "Failed to get point stats" });
    }
}
/**
 * GET /api/pointlog/filter - Obtener registros con filtros (admin)
 */
async function getPointLogs(req, res) {
    try {
        const { userId, ratingId, requestId } = req.query;
        const pointLogs = await pointlogService.getPointLogs({
            userId: userId,
            ratingId: ratingId,
            requestId: requestId,
        });
        return res.json({ pointLogs });
    }
    catch (error) {
        return res
            .status(400)
            .json({ message: error.message || "Failed to get point logs" });
    }
}
