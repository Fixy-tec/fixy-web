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
exports.googleLogin = googleLogin;
exports.googleCallback = googleCallback;
exports.logout = logout;
exports.me = me;
const authService = __importStar(require("../services/auth.service"));
async function googleLogin(_req, res) {
    try {
        const url = authService.getGoogleAuthUrl();
        return res.redirect(url);
    }
    catch (error) {
        console.error("[GET /auth/google]", error);
        return res.status(500).json({
            message: "Google OAuth no está configurado correctamente",
        });
    }
}
async function googleCallback(req, res) {
    try {
        const code = typeof req.body?.code === "string"
            ? req.body.code
            : typeof req.query.code === "string"
                ? req.query.code
                : null;
        if (!code) {
            return res.status(400).json({ message: "Código de autorización requerido" });
        }
        const result = await authService.handleGoogleCallback(code);
        return res.json(result);
    }
    catch (error) {
        if (error instanceof authService.InstitutionalEmailRejectedError) {
            return res.status(403).json({ message: error.message, code: "INSTITUTIONAL_EMAIL_REJECTED" });
        }
        if (error instanceof authService.AccountDisabledError) {
            return res.status(403).json({ message: error.message, code: "ACCOUNT_DISABLED" });
        }
        if (error instanceof authService.GoogleAuthError) {
            return res.status(401).json({ message: error.message, code: "GOOGLE_AUTH_FAILED" });
        }
        console.error("[POST /auth/google/callback]", error);
        return res.status(500).json({ message: "Error al procesar autenticación con Google" });
    }
}
async function logout(_req, res) {
    return res.json({ message: "Logout successful" });
}
async function me(req, res) {
    const authReq = req;
    const userId = authReq.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await authService.validateSession(userId);
    if (!user) {
        return res.status(401).json({ message: "Sesión inválida" });
    }
    return res.json({ user });
}
