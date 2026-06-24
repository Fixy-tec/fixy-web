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
exports.GoogleAuthError = exports.AccountDisabledError = exports.InstitutionalEmailRejectedError = void 0;
exports.generateTokens = generateTokens;
exports.getGoogleAuthUrl = getGoogleAuthUrl;
exports.handleGoogleCallback = handleGoogleCallback;
exports.validateSession = validateSession;
const client_1 = require("@prisma/client");
const jwt_1 = require("../../../utils/jwt");
const google_oauth_1 = require("../config/google.oauth");
const auth_constants_1 = require("../constants/auth.constants");
const authRepository = __importStar(require("../repositories/auth.repository"));
const admin_realtime_1 = require("../../../realtime/admin.realtime");
class InstitutionalEmailRejectedError extends Error {
    constructor() {
        super(auth_constants_1.INSTITUTIONAL_REJECTION_MESSAGE);
        this.name = "InstitutionalEmailRejectedError";
    }
}
exports.InstitutionalEmailRejectedError = InstitutionalEmailRejectedError;
class AccountDisabledError extends Error {
    constructor() {
        super("Account is disabled");
        this.name = "AccountDisabledError";
    }
}
exports.AccountDisabledError = AccountDisabledError;
class GoogleAuthError extends Error {
    constructor(message = "Error al autenticar con Google") {
        super(message);
        this.name = "GoogleAuthError";
    }
}
exports.GoogleAuthError = GoogleAuthError;
function sanitizeName(name) {
    const trimmed = name.trim();
    if (!trimmed)
        return "Estudiante";
    return trimmed.slice(0, 80);
}
function toAuthUserDto(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
        institution: user.institution,
    };
}
function generateTokens(user) {
    return (0, jwt_1.signJwt)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
}
function getGoogleAuthUrl() {
    const client = (0, google_oauth_1.getGoogleOAuthClient)();
    return client.generateAuthUrl({
        access_type: "offline",
        prompt: "select_account",
        scope: ["openid", "email", "profile"],
        redirect_uri: (0, google_oauth_1.getGoogleRedirectUri)(),
    });
}
async function handleGoogleCallback(code) {
    const client = (0, google_oauth_1.getGoogleOAuthClient)();
    let tokens;
    try {
        const result = await client.getToken({ code, redirect_uri: (0, google_oauth_1.getGoogleRedirectUri)() });
        tokens = result.tokens;
    }
    catch {
        throw new GoogleAuthError("No se pudo intercambiar el código de autorización");
    }
    if (!tokens.id_token) {
        throw new GoogleAuthError("Google no devolvió un token de identidad");
    }
    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
        throw new GoogleAuthError("Respuesta de Google incompleta");
    }
    const email = payload.email.toLowerCase().trim();
    const googleId = payload.sub;
    const name = sanitizeName(payload.name ?? email.split("@")[0]);
    if (!(0, auth_constants_1.validateInstitutionalEmail)(email)) {
        throw new InstitutionalEmailRejectedError();
    }
    const user = await createOrLoginGoogleUser({ googleId, email, name });
    const accessToken = generateTokens(user);
    return {
        user: toAuthUserDto(user),
        accessToken,
    };
}
async function createOrLoginGoogleUser(input) {
    const institution = (0, auth_constants_1.getInstitutionForEmail)(input.email);
    let user = (await authRepository.findByGoogleId(input.googleId)) ??
        (await authRepository.findByEmail(input.email));
    if (user) {
        if (!user.isActive) {
            throw new AccountDisabledError();
        }
        if (!user.googleId) {
            user = await authRepository.updateGoogleData(user.id, {
                googleId: input.googleId,
                name: input.name,
            });
        }
    }
    else {
        user = await authRepository.createGoogleUser({
            email: input.email,
            name: input.name,
            googleId: input.googleId,
            institution,
            role: client_1.Role.USER,
        });
        void (0, admin_realtime_1.notifyAdminDashboardUpdate)();
    }
    return user;
}
async function validateSession(userId) {
    const user = await authRepository.findById(userId);
    if (!user || !user.isActive)
        return null;
    return toAuthUserDto(user);
}
