"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authMiddleware = void 0;
exports.adminMiddleware = adminMiddleware;
const auth_middleware_1 = require("./auth.middleware");
/** Alias explícito para validación JWT en rutas administrativas. */
exports.authMiddleware = auth_middleware_1.authenticateJWT;
/** Requiere usuario autenticado con rol ADMIN. */
exports.requireAdmin = (0, auth_middleware_1.requireRole)("ADMIN");
function adminMiddleware(req, res, next) {
    (0, auth_middleware_1.authenticateJWT)(req, res, (authErr) => {
        if (authErr)
            return next(authErr);
        (0, auth_middleware_1.requireRole)("ADMIN")(req, res, next);
    });
}
