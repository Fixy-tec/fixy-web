import { z } from "zod";

import { containsEmoji, normalizeUsername } from "../utils/text.utils";

// Permite formato `nombre@tecsup.edu.pe` y `nombre.apellido@tecsup.edu.pe`
// (uno o más bloques de letras separados por un único punto). No permite
// puntos al inicio/fin ni dos puntos seguidos.
const TECSUP_EMAIL_REGEX = /^[A-Za-z]+(?:\.[A-Za-z]+)*@tecsup\.edu\.pe$/;

export const registerSchema = z.object({
  email: z
    .string()
    .regex(TECSUP_EMAIL_REGEX, {
      message:
        "Email must be institutional (@tecsup.edu.pe) and contain only letters and dots before the domain",
    })
    .transform((value) => value.toLowerCase().trim()),

  name: z
    .string()
    .min(2, {
      message: "Username must contain at least 2 characters",
    })
    .max(15, {
      message: "Username must not exceed 15 characters",
    })
    .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/, {
      message: "Username can contain only letters (accents and ñ allowed)",
    })
    .refine((value) => !containsEmoji(value), {
      message: "Username cannot contain emojis",
    })
    .transform((value) => normalizeUsername(value)),

  password: z
    .string()
    .min(8, {
      message: "Password must contain at least 8 characters",
    })
    .max(20, {
      message: "Password must not exceed 20 characters",
    })
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, {
      message: "Password must contain letters and numbers",
    })
    .refine((value) => !containsEmoji(value), {
      message: "Password cannot contain emojis",
    }),
});
