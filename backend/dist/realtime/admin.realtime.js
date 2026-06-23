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
exports.setupAdminRealtime = setupAdminRealtime;
exports.notifyAdminDashboardUpdate = notifyAdminDashboardUpdate;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../utils/jwt");
const adminRepository = __importStar(require("../modules/admin/repositories/admin.repository"));
let adminNamespace = null;
function getAllowedOrigins() {
    return process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
        : ["http://localhost:3000", "http://127.0.0.1:3000"];
}
function setupAdminRealtime(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: getAllowedOrigins(),
            credentials: true,
        },
    });
    adminNamespace = io.of("/admin");
    adminNamespace.use((socket, next) => {
        const token = socket.handshake.auth?.token ||
            socket.handshake.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return next(new Error("Authorization token missing"));
        }
        try {
            const payload = (0, jwt_1.verifyJwt)(token);
            if (payload.role !== "ADMIN") {
                return next(new Error("Insufficient permissions"));
            }
            socket.data.user = payload;
            return next();
        }
        catch {
            return next(new Error("Invalid or expired token"));
        }
    });
    adminNamespace.on("connection", (socket) => {
        console.log(`[realtime] Admin conectado: ${socket.data.user?.email ?? "unknown"}`);
        socket.on("disconnect", () => {
            console.log(`[realtime] Admin desconectado: ${socket.data.user?.email ?? "unknown"}`);
        });
    });
}
async function notifyAdminDashboardUpdate() {
    if (!adminNamespace)
        return;
    try {
        const dashboard = await adminRepository.getDashboardStats();
        adminNamespace.emit("admin:dashboard:update", dashboard);
    }
    catch (error) {
        console.error("[admin:dashboard:update] Error emitiendo actualización:", error);
    }
}
