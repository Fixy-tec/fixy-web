"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.createUser = createUser;
const prisma_1 = __importDefault(require("../../../prisma"));
const client_1 = require("@prisma/client");
async function findUserByEmail(email) {
    return prisma_1.default.user.findUnique({
        where: { email },
        include: {
            profile: true,
            userTags: { include: { tag: true } },
        },
    });
}
async function findUserById(id) {
    return prisma_1.default.user.findUnique({
        where: { id },
        include: {
            profile: true,
            userTags: { include: { tag: true } },
        },
    });
}
async function createUser(data) {
    return prisma_1.default.user.create({
        data: {
            email: data.email,
            password: data.password,
            role: data.role ?? client_1.Role.USER,
        },
        include: {
            profile: true,
            userTags: { include: { tag: true } },
        },
    });
}
