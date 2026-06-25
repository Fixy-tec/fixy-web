/**
 * Dominios institucionales permitidos.
 * Para multi-institución futura: ampliar este mapa (ej. UNSA → @uns.edu.pe).
 */
export const INSTITUTIONAL_EMAIL_SUFFIXES = ["@tecsup.edu.pe"] as const;

export const DEFAULT_INSTITUTION = "TECSUP";

export const INSTITUTIONAL_REJECTION_MESSAGE =
  "Fixy actualmente solo está disponible para estudiantes de TECSUP.";

export function validateInstitutionalEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  return INSTITUTIONAL_EMAIL_SUFFIXES.some((suffix) =>
    normalized.endsWith(suffix),
  );
}

export function getInstitutionForEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  if (normalized.endsWith("@tecsup.edu.pe")) return "TECSUP";
  return DEFAULT_INSTITUTION;
}
