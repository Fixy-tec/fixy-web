"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getUserWithProfile = getUserWithProfile;
exports.updateUserProfile = updateUserProfile;
const prisma_1 = __importDefault(require("../../../prisma"));
async function getUsers() {
    return prisma_1.default.user.findMany({
        include: {
            profile: true,
            userTags: { include: { tag: true } },
        },
    });
}
async function getUserById(id) {
    return prisma_1.default.user.findUnique({
        where: { id },
        include: {
            profile: true,
            userTags: { include: { tag: true } },
        },
    });
}
async function getUserWithProfile(userId) {
    return prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            profile: true,
            userTags: { include: { tag: true } },
        },
    });
}
async function updateUserProfile(userId, data) {
    const profileData = {
        avatarUrl: data.avatarUrl,
        whatsapp: data.whatsapp,
        bio: data.bio,
        portfolioUrl: data.portfolioUrl,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
    };
    const tagUpdates = data.tagIds !== undefined
        ? {
            deleteMany: {},
            create: data.tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
            })),
        }
        : undefined;
    return prisma_1.default.user.update({
        where: { id: userId },
        data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            profile: {
                upsert: {
                    create: profileData,
                    update: profileData,
                },
            },
            userTags: tagUpdates,
        },
        include: {
            profile: true,
            userTags: { include: { tag: true } },
        },
    });
}
