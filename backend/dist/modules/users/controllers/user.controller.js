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
        const user = await userService.updateCurrentUser(userId, validatedData);
        return res.json({ user });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: error.issues[0]?.message,
            });
        }
        if (error instanceof userService.InvalidTagNamesError) {
            return res.status(400).json({ message: error.message });
        }
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
async function getUserById(req, res) {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user });
}
