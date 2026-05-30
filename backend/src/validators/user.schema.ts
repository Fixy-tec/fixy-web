import { z } from "zod";

import {
  countEmojis,
  normalizeText,
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