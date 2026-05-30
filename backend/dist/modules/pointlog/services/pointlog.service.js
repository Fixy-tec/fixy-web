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
exports.createPointLog = createPointLog;
exports.getPointLogs = getPointLogs;
exports.getUserPointHistory = getUserPointHistory;
exports.getUserPointStats = getUserPointStats;
const pointlogRepository = __importStar(require("../repositories/pointlog.repository"));
/**
 * Crear un registro de puntos
 */
async function createPointLog(input) {
    if (!input.userId || input.delta === undefined) {
        throw new Error("UserId and delta are required");
    }
    if (typeof input.delta !== "number" || !Number.isInteger(input.delta)) {
        throw new Error("Delta must be an integer");
    }
    if (!input.reason || input.reason.trim().length === 0) {
        throw new Error("Reason cannot be empty");
    }
    const pointLog = await pointlogRepository.createPointLog(input);
    return pointLog;
}
/**
 * Obtener registros de puntos
 */
async function getPointLogs(filters) {
    return pointlogRepository.getPointLogs(filters);
}
/**
 * Obtener historial de puntos de un usuario
 */
async function getUserPointHistory(userId, limit) {
    return pointlogRepository.getUserPointHistory(userId, limit);
}
/**
 * Obtener estadísticas de puntos de un usuario
 */
async function getUserPointStats(userId) {
    return pointlogRepository.getUserPointStats(userId);
}
