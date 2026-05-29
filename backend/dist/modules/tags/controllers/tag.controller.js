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
exports.getTags = getTags;
exports.getTagById = getTagById;
exports.createTag = createTag;
exports.deleteTag = deleteTag;
const tagService = __importStar(require("../services/tag.service"));
async function getTags(_req, res) {
    const tags = await tagService.getTags();
    return res.json({ tags });
}
async function getTagById(req, res) {
    const tag = await tagService.getTagById(req.params.id);
    if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
    }
    return res.json({ tag });
}
async function createTag(req, res) {
    const authReq = req;
    if (!authReq.user || authReq.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden - Admin only" });
    }
    const { name, isCustom } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
    }
    const tag = await tagService.createTag(name, isCustom || false);
    return res.status(201).json({ tag });
}
async function deleteTag(req, res) {
    const authReq = req;
    if (!authReq.user || authReq.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden - Admin only" });
    }
    const tag = await tagService.deleteTag(req.params.id);
    return res.json({ tag });
}
