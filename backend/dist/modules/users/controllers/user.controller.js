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
exports.getCurrentUser = getCurrentUser;
exports.updateCurrentUser = updateCurrentUser;
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getRanking = getRanking;
const userService = __importStar(require("../services/user.service"));
const zod_1 = require("zod");
const user_schema_1 = require("../../../validators/user.schema");
async function getCurrentUser(req, res) {
    const authReq = req;
    const userId = authReq.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await userService.getCurrentUser(userId);
    return res.json({ user });
}
async function updateCurrentUser(req, res) {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const validatedData = user_schema_1.updateProfileSchema.parse(req.body);
        const user = await userService.updateCurrentUser(userId, {
            name: validatedData.name,
            avatarUrl: validatedData.avatarUrl,
            whatsapp: validatedData.whatsapp,
            bio: validatedData.bio,
            portfolioUrl: validatedData.portfolioUrl,
            linkedinUrl: validatedData.linkedinUrl,
            githubUrl: validatedData.githubUrl,
            tags: validatedData.tagIds,
        });
        return res.json({ user });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const first = error.issues[0];
            const field = first?.path?.join(".") || "body";
            const message = first?.message || "Invalid payload";
            console.error("[PATCH /users/me] Zod error:", error.issues);
            return res.status(400).json({
                message: `${field}: ${message}`,
                field,
                issues: error.issues.map((i) => ({
                    path: i.path.join("."),
                    message: i.message,
                })),
            });
        }
        if (error instanceof userService.InvalidTagNamesError) {
            return res.status(400).json({ message: error.message });
        }
        if (error instanceof userService.UsernameTakenError) {
            return res.status(409).json({ message: error.message });
        }
        console.error("[PATCH /users/me] Unexpected error:", error);
        return res.status(400).json({
            message: error.message ||
                "Failed to update profile",
        });
    }
}
async function getUsers(_req, res) {
    const users = await userService.getUsers();
    return res.json({ users });
}
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function getUserById(req, res) {
    const id = req.params.id;
    // Guarda: si el `id` no parece UUID es casi seguro que la ruta dinámica
    // está capturando algo que debería ser una sub-ruta (ej: `/users/ranking`
    // si el orden de rutas se rompió). Devolvemos 400 para fallar rápido en
    // vez de un `404 User not found` confuso.
    if (!UUID_REGEX.test(id)) {
        return res
            .status(400)
            .json({ message: `Invalid user id: '${id}' is not a UUID` });
    }
    try {
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error("[GET /users/:id] error:", error);
        return res
            .status(500)
            .json({ message: error?.message ?? "Failed to load user" });
    }
}
/**
 * GET /users/ranking
 * Query: ?limit=50&medal=ORO
 * Devuelve el top global (o por medalla) de usuarios activos ordenados por
 * puntos. Cada entrada incluye `rank` (posición), `points`, `medal`,
 * `completedRequests` y datos de `profile` para mostrar avatar/carrera.
 */
async function getRanking(req, res) {
    try {
        const limitRaw = req.query.limit;
        const medalRaw = req.query.medal;
        const limit = typeof limitRaw === "string" && !Number.isNaN(Number(limitRaw))
            ? Number(limitRaw)
            : undefined;
        const medal = typeof medalRaw === "string" ? medalRaw : undefined;
        const ranking = await userService.getUsersRanking({ limit, medal });
        return res.json({ ranking });
    }
    catch (error) {
        console.error("[GET /users/ranking] error:", error);
        return res
            .status(500)
            .json({ message: error?.message ?? "Failed to load ranking" });
    }
}
