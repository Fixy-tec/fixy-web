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
const password_1 = require("../../../utils/password");
const jwt_1 = require("../../../utils/jwt");
const authRepository = __importStar(require("../repositories/auth.repository"));
const client_1 = require("@prisma/client");
async function register(input) {
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) {
        throw new Error("Email already registered");
    }
    const hashedPassword = await (0, password_1.hashPassword)(input.password);
    const user = await authRepository.createUser({
        email: input.email,
        password: hashedPassword,
        role: client_1.Role.USER,
    });
    const accessToken = (0, jwt_1.signJwt)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    return { user: sanitizeUser(user), accessToken };
}
async function login(input) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
        throw new Error("Invalid credentials");
    }
    const passwordMatch = await (0, password_1.comparePassword)(input.password, user.password);
    if (!passwordMatch) {
        throw new Error("Invalid credentials");
    }
    const accessToken = (0, jwt_1.signJwt)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    return { user: sanitizeUser(user), accessToken };
}
function sanitizeUser(user) {
    const { password, ...rest } = user;
    return {
        ...rest,
        tags: user.userTags?.map((userTag) => userTag.tag.name) ?? [],
    };
}
