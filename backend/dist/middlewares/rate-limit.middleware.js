"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRateLimiter = exports.passwordAuthRateLimiter = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 3900000000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many login attempts. Please try again later.",
    },
});
/** Login y registro con contraseña: frena fuerza bruta por IP. */
exports.passwordAuthRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
    },
});
/** Pagos: evita que se prueben tarjetas en masa. */
exports.paymentRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Demasiados intentos de pago. Espera unos minutos.",
    },
});
