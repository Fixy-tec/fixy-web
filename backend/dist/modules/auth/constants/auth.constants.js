"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstitutionForEmail = getInstitutionForEmail;
/**
 * Registro libre: se acepta cualquier correo. Los dominios de este mapa solo
 * sirven para autocompletar la institución del usuario.
 */
const INSTITUTION_BY_EMAIL_SUFFIX = {
    "@tecsup.edu.pe": "TECSUP",
};
function getInstitutionForEmail(email) {
    const normalized = email.toLowerCase().trim();
    for (const [suffix, institution] of Object.entries(INSTITUTION_BY_EMAIL_SUFFIX)) {
        if (normalized.endsWith(suffix))
            return institution;
    }
    return null;
}
