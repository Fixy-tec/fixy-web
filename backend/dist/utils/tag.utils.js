"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTag = normalizeTag;
function normalizeTag(tag) {
    return tag
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}
