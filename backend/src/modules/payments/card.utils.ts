/**
 * Validación de tarjetas para la pasarela en MODO PRUEBA.
 *
 * No se conecta a ningún banco: valida el formato como lo haría una pasarela
 * real y decide el resultado de forma determinista. Nunca se guarda el número
 * completo ni el CVV; solo la marca y los últimos 4 dígitos.
 */

export type CardBrand = "VISA" | "MASTERCARD" | "AMEX" | "DINERS";

export interface CardInput {
  number: string;
  holder: string;
  expMonth: number;
  expYear: number;
  cvv: string;
}

export interface ValidCard {
  brand: CardBrand;
  last4: string;
  holder: string;
  digits: string;
}

export class CardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardValidationError";
  }
}

/** Tarjetas de prueba que fuerzan un rechazo (cualquier otra válida se aprueba). */
export const TEST_DECLINES: Record<string, string> = {
  "4000000000000002": "Tarjeta rechazada por el banco emisor",
  "4000000000009995": "Fondos insuficientes",
  "4000000000000069": "La tarjeta está vencida según el banco emisor",
  "4000000000000127": "CVV incorrecto",
};

export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function detectBrand(digits: string): CardBrand | null {
  if (/^4\d{15}$/.test(digits)) return "VISA";
  if (/^(5[1-5]\d{14}|2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12})$/.test(digits)) {
    return "MASTERCARD";
  }
  if (/^3[47]\d{13}$/.test(digits)) return "AMEX";
  if (/^3(0[0-5]|[68]\d)\d{11}$/.test(digits)) return "DINERS";
  return null;
}

export function validateCard(input: CardInput, now = new Date()): ValidCard {
  const digits = input.number.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits)) {
    throw new CardValidationError("Número de tarjeta inválido");
  }
  const brand = detectBrand(digits);
  if (!brand) {
    throw new CardValidationError("Solo aceptamos Visa, Mastercard, Amex o Diners");
  }
  if (!luhnValid(digits)) {
    throw new CardValidationError("El número de tarjeta no es válido");
  }

  const holder = input.holder.trim().replace(/\s+/g, " ");
  if (holder.length < 3 || !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .]+$/.test(holder)) {
    throw new CardValidationError("Ingresa el nombre como aparece en la tarjeta");
  }

  const { expMonth, expYear } = input;
  if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
    throw new CardValidationError("Mes de vencimiento inválido");
  }
  const fullYear = expYear < 100 ? 2000 + expYear : expYear;
  // Vence el último día del mes indicado
  const expiry = new Date(fullYear, expMonth, 1);
  if (expiry.getTime() <= now.getTime()) {
    throw new CardValidationError("La tarjeta está vencida");
  }
  if (fullYear > now.getFullYear() + 20) {
    throw new CardValidationError("Año de vencimiento inválido");
  }

  const cvvLength = brand === "AMEX" ? 4 : 3;
  if (!new RegExp(`^\\d{${cvvLength}}$`).test(input.cvv)) {
    throw new CardValidationError(`El CVV debe tener ${cvvLength} dígitos`);
  }

  return { brand, last4: digits.slice(-4), holder: holder.toUpperCase(), digits };
}

/** Resultado simulado del "banco" para una tarjeta ya validada. */
export function simulateAuthorization(card: ValidCard): { approved: true } | { approved: false; reason: string } {
  const reason = TEST_DECLINES[card.digits];
  return reason ? { approved: false, reason } : { approved: true };
}
