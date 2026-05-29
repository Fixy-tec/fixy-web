"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
const jsonwebtoken_1 = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET ?? "change_this_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";
function signJwt(payload) {
    return (0, jsonwebtoken_1.sign)(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}
function verifyJwt(token) {
    return (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
}
