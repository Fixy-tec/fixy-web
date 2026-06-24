"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = exports.findUserByEmail = void 0;
exports.findByEmail = findByEmail;
exports.findByGoogleId = findByGoogleId;
exports.findById = findById;
exports.createGoogleUser = createGoogleUser;
exports.updateGoogleData = updateGoogleData;
exports.markProfileCompleted = markProfileCompleted;
const prisma_1 = __importDefault(require("../../../prisma"));
const client_1 = require("@prisma/client");
const userInclude = {
    profile: true,
    userTags: { include: { tag: true } },
};
async function findByEmail(email) {
    return prisma_1.default.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: userInclude,
    });
}
/** @deprecated Usar findByEmail */
exports.findUserByEmail = findByEmail;
async function findByGoogleId(googleId) {
    return prisma_1.default.user.findUnique({
        where: { googleId },
        include: userInclude,
    });
}
async function findById(id) {
    return prisma_1.default.user.findUnique({
        where: { id },
        include: userInclude,
    });
}
/** @deprecated Usar findById */
exports.findUserById = findById;
async function createGoogleUser(data) {
    return prisma_1.default.user.create({
        data: {
            email: data.email.toLowerCase().trim(),
            name: data.name,
            googleId: data.googleId,
            role: data.role ?? client_1.Role.USER,
            institution: data.institution ?? "TECSUP",
            profileCompleted: false,
        },
        include: userInclude,
    });
}
async function updateGoogleData(userId, data) {
    return prisma_1.default.user.update({
        where: { id: userId },
        data: {
            googleId: data.googleId,
            ...(data.name ? { name: data.name } : {}),
        },
        include: userInclude,
    });
}
async function markProfileCompleted(userId) {
    return prisma_1.default.user.update({
        where: { id: userId },
        data: { profileCompleted: true },
        include: userInclude,
    });
}
