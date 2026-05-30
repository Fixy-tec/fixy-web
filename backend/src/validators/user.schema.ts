import { z } from "zod";

import {
  containsEmoji,
  countEmojis,
  normalizeText,
  normalizeUsername,
} from "../utils/text.utils";

const BIO_REGEX =
  /^[A-Za-z0-9\s*.,\-/#@!?¿¡\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u;

/** Acepta URL absoluta (http/https) o path absoluto local (`/avatars/...`). */
const urlOrAbsolutePath = z
  .string()
  .refine(
    (value) => {
      if (value.startsWith("/")) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Must be a valid URL or absolute path" },
  );

export const updateProfileSchema =
  z.object({

    /** Mismas reglas que `auth.schema.ts > registerSchema.name` */
    name: z
      .string()
      .min(2, {
        message: "Username must contain at least 2 characters",
      })
      .max(15, {
        message: "Username must not exceed 15 characters",
      })
      .regex(/^[A-Za-z]+$/, {
        message: "Username can contain only letters",
      })
      .refine((value) => !containsEmoji(value), {
        message: "Username cannot contain emojis",
      })
      .transform((value) => normalizeUsername(value))
      .optional(),

    whatsapp: z
      .string()
      .regex(/^(?:\+51)?9\d{8}$/, {
        message: "Invalid WhatsApp number",
      }),

    bio: z
      .string()
      .min(10)
      .max(300)
      .transform((value) =>
        normalizeText(value)
      )
      .refine(
        (value) => BIO_REGEX.test(value),
        {
          message:
            "Bio contains invalid characters",
        }
      )
      .refine(
        (value) =>
          countEmojis(value) <= 5,
        {
          message:
            "Bio can contain a maximum of 5 emojis",
        }
      )
      .optional(),

    avatarUrl: urlOrAbsolutePath.optional(),

    portfolioUrl: z
      .url()
      .optional(),

    linkedinUrl: z
      .url()
      .optional(),

    githubUrl: z
      .url()
      .optional(),

    tagIds: z
      .array(z.string())
      .max(5, {
        message:
          "Maximum 5 tags allowed",
      })
      .optional(),
  });