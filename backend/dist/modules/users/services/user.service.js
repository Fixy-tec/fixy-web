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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidTagNamesError = void 0;
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getCurrentUser = getCurrentUser;
exports.updateCurrentUser = updateCurrentUser;
const prisma_1 = __importDefault(require("../../../prisma"));
const userRepository = __importStar(require("../repositories/user.repository"));
const tagRepository = __importStar(require("../../tags/repositories/tag.repository"));
function toPublicUser(user) {
    if (!user)
        return null;
    const { password: _pw, ...rest } = user;
    return rest;
}
async function getUsers() {
    return userRepository.getUsers();
}
async function getUserById(id) {
    return userRepository.getUserById(id);
}
async function attachUserStats(user) {
    const completedRequests = await prisma_1.default.request.count({
        where: { creatorId: user.id, status: "COMPLETADA" },
    });
    return {
        ...user,
        stats: { completedRequests },
    };
}
async function getCurrentUser(userId) {
    const user = await userRepository.getUserWithProfile(userId);
    const publicUser = toPublicUser(user);
    if (!publicUser)
        return null;
    return attachUserStats(publicUser);
}
class InvalidTagNamesError extends Error {
    constructor() {
        super("Uno o más tags no existen en el catálogo");
        this.name = "InvalidTagNamesError";
    }
}
exports.InvalidTagNamesError = InvalidTagNamesError;
async function updateCurrentUser(userId, data) {
    let tagIds = undefined;
    if (data.tags !== undefined) {
        const uniqueNames = [
            ...new Set(data.tags.map((t) => t.trim()).filter((t) => t.length > 0)),
        ];
        if (uniqueNames.length === 0) {
            tagIds = [];
        }
        else {
            const found = await tagRepository.findTagsByNames(uniqueNames);
            if (found.length !== uniqueNames.length) {
                throw new InvalidTagNamesError();
            }
            tagIds = found.map((t) => t.id);
        }
    }
    const updated = await userRepository.updateUserProfile(userId, {
        avatarUrl: data.avatarUrl,
        whatsapp: data.whatsapp,
        bio: data.bio,
        portfolioUrl: data.portfolioUrl,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        tagIds,
    });
    const publicUser = toPublicUser(updated);
    if (!publicUser)
        return null;
    return attachUserStats(publicUser);
}
