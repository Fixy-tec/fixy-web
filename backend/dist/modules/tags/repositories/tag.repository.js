"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTags = getTags;
exports.findTagsByNames = findTagsByNames;
exports.findTagsByIds = findTagsByIds;
exports.getTagById = getTagById;
exports.getTagByName = getTagByName;
exports.createTag = createTag;
exports.createTags = createTags;
exports.deleteTag = deleteTag;
const prisma_1 = __importDefault(require("../../../prisma"));
async function getTags() {
    return prisma_1.default.tag.findMany({
        orderBy: {
            name: "asc",
        },
    });
}
async function findTagsByNames(names) {
    if (names.length === 0)
        return [];
    return prisma_1.default.tag.findMany({
        where: { name: { in: names } },
        select: { id: true, name: true },
    });
}
async function findTagsByIds(ids) {
    if (ids.length === 0)
        return [];
    return prisma_1.default.tag.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
    });
}
async function getTagById(id) {
    return prisma_1.default.tag.findUnique({
        where: { id },
    });
}
async function getTagByName(name) {
    return prisma_1.default.tag.findUnique({
        where: { name },
    });
}
async function createTag(name, isCustom = false) {
    return prisma_1.default.tag.create({
        data: {
            name,
            isCustom,
        },
    });
}
async function createTags(tags) {
    const createdTags = [];
    for (const tag of tags) {
        const existingTag = await getTagByName(tag.name);
        if (!existingTag) {
            const newTag = await createTag(tag.name, tag.isCustom || false);
            createdTags.push(newTag);
        }
        else {
            createdTags.push(existingTag);
        }
    }
    return createdTags;
}
async function deleteTag(id) {
    return prisma_1.default.tag.delete({
        where: { id },
    });
}
