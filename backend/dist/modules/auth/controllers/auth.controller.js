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
exports.register = register;
exports.login = login;
exports.logout = logout;
const authService = __importStar(require("../services/auth.service"));
const auth_schema_1 = require("../../../validators/auth.schema");
const zod_1 = require("zod");
async function register(req, res) {
    try {
        const validatedData = auth_schema_1.registerSchema.parse(req.body);
        const result = await authService.register(validatedData);
        return res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const first = error.issues[0];
            const field = first?.path?.join(".") || "body";
            const message = first?.message || "Invalid payload";
            console.error("[POST /auth/register] Zod error:", error.issues);
            return res.status(400).json({
                message: `${field}: ${message}`,
                field,
                issues: error.issues.map((i) => ({
                    path: i.path.join("."),
                    message: i.message,
                })),
            });
        }
        console.error("[POST /auth/register] Error:", error?.message);
        return res.status(400).json({
            message: error.message || "Registration failed",
        });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const result = await authService.login({ email, password });
        return res.json(result);
    }
    catch (error) {
        return res.status(401).json({ message: error.message || "Invalid credentials" });
    }
}
async function logout(req, res) {
    try {
        return res.json({ message: "Logout successful" });
    }
    catch (error) {
        return res.status(500).json({ message: error.message || "Logout failed" });
    }
}
