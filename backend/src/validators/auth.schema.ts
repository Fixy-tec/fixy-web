import { z } from "zod";

import {
  containsEmoji,
  normalizeUsername,
} from "../utils/text.utils";

const TECSUP_EMAIL_REGEX =
  /^[A-Za-z]+@tecsup\.edu\.pe$/;

export const registerSchema = z.object({
  email: z
    .string()
    .regex(TECSUP_EMAIL_REGEX, {
      message:
        "Email must be institutional (@tecsup.edu.pe) and contain only letters before the domain",
    })
    .transform((value) =>
      value.toLowerCase().trim()
    ),

  name: z
    .string()
    .min(5)
    .max(15)
    .regex(/^[A-Za-z]+$/, {
      message:
        "Username can contain only letters",
    })
    .refine((value) => !containsEmoji(value), {
      message:
        "Username cannot contain emojis",
    })
    .transform((value) =>
      normalizeUsername(value)
    ),

  password: z
    .string()
    .min(8)
    .max(20)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, {
      message:
        "Password must contain letters and numbers",
    })
    .refine((value) => !containsEmoji(value), {
      message:
        "Password cannot contain emojis",
    }),
});