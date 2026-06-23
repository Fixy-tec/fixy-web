"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUsername = isValidUsername;
exports.containsEmoji = containsEmoji;
exports.isValidPassword = isValidPassword;
function isValidUsername(username) {
    // Acepta letras latinas incluyendo tildes y ñ (mayúsculas y minúsculas).
    const usernameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{5,15}$/;
    return usernameRegex.test(username);
}
function containsEmoji(text) {
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    return emojiRegex.test(text);
}
function isValidPassword(password) {
    // 8-20 chars
    // at least 1 letter
    // at least 1 number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]{8,20}$/;
    return (passwordRegex.test(password) &&
        !containsEmoji(password));
}
