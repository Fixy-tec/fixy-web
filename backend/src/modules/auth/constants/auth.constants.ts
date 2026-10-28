/**
 * Registro libre: se acepta cualquier correo. Los dominios de este mapa solo
 * sirven para autocompletar la institución del usuario.
 */
const INSTITUTION_BY_EMAIL_SUFFIX: Record<string, string> = {
  "@tecsup.edu.pe": "TECSUP",
};

export function getInstitutionForEmail(email: string): string | null {
  const normalized = email.toLowerCase().trim();
  for (const [suffix, institution] of Object.entries(INSTITUTION_BY_EMAIL_SUFFIX)) {
    if (normalized.endsWith(suffix)) return institution;
  }
  return null;
}
