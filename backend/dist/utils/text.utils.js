"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsEmoji = containsEmoji;
exports.countEmojis = countEmojis;
exports.normalizeUsername = normalizeUsername;
exports.normalizeText = normalizeText;
exports.countSpecialCharacters = countSpecialCharacters;
function containsEmoji(text) {
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    return emojiRegex.test(text);
}
function countEmojis(text) {
    const matches = text.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
    return matches ? matches.length : 0;
}
function normalizeUsername(username) {
    return username
        .trim()
        .toLowerCase();
}
function normalizeText(text) {
    return text
        .trim()
        .replace(/\s+/g, " ");
}
function countSpecialCharacters(text) {
    const matches = text.match(/[*\/.\-#!?]/g);
    return matches ? matches.length : 0;
}
