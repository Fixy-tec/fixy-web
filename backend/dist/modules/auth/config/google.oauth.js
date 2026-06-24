"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFrontendUrl = getFrontendUrl;
exports.getGoogleRedirectUri = getGoogleRedirectUri;
exports.getGoogleOAuthClient = getGoogleOAuthClient;
const google_auth_library_1 = require("google-auth-library");
function getFrontendUrl() {
    return (process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000");
}
function getGoogleRedirectUri() {
    return `${getFrontendUrl()}/api/auth/google/callback`;
}
function getGoogleOAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error("GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar configurados");
    }
    return new google_auth_library_1.OAuth2Client(clientId, clientSecret, getGoogleRedirectUri());
}
