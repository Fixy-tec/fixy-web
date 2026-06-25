"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTITUTIONAL_REJECTION_MESSAGE = exports.DEFAULT_INSTITUTION = exports.INSTITUTIONAL_EMAIL_SUFFIXES = void 0;
exports.validateInstitutionalEmail = validateInstitutionalEmail;
exports.getInstitutionForEmail = getInstitutionForEmail;
/**
 * Dominios institucionales permitidos.
 * Para multi-institución futura: ampliar este mapa (ej. UNSA → @uns.edu.pe).
 */
exports.INSTITUTIONAL_EMAIL_SUFFIXES = ["@tecsup.edu.pe"];
exports.DEFAULT_INSTITUTION = "TECSUP";
exports.INSTITUTIONAL_REJECTION_MESSAGE = "Fixy actualmente solo está disponible para estudiantes de TECSUP.";
function validateInstitutionalEmail(email) {
    const normalized = email.toLowerCase().trim();
    return exports.INSTITUTIONAL_EMAIL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}
function getInstitutionForEmail(email) {
    const normalized = email.toLowerCase().trim();
    if (normalized.endsWith("@tecsup.edu.pe"))
        return "TECSUP";
    return exports.DEFAULT_INSTITUTION;
}
