import { z } from "zod";

import {
  containsEmoji,
  countEmojis,
  normalizeText,
} from "../utils/text.utils";

import { normalizeTag } from "../utils/tag.utils";

import {countSpecialCharacters} from "../utils/text.utils";

const TITLE_REGEX =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s*\/.\-#!?]+$/u;

const DESCRIPTION_REGEX =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s*\/.\-#!?,¿¡\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u;

export const createRequestSchema =
  z.object({

    type: z.enum([
      "ASESORIA",
      "PROYECTO",
    ]),

    title: z
      .string()
      .min(5)
      .max(80)
      .transform((value) =>
        normalizeText(value)
      )
      .refine(
        (value) =>
          TITLE_REGEX.test(value),
        {
          message:
            "Title contains invalid characters",
        }
      )
      .refine(
        (value) =>
          !containsEmoji(value),
        {
          message:
            "Title cannot contain emojis",
        }
      )
      .refine(
        (value) =>
          countSpecialCharacters(value) <= 5,
        {
          message:
            "Title can contain a maximum of 5 special characters",
        }
      ),

    description: z
      .string()
      .min(10)
      .max(1000)
      .transform((value) =>
        normalizeText(value)
      )
      .refine(
        (value) =>
          DESCRIPTION_REGEX.test(value),
        {
          message:
            "Description contains invalid characters",
        }
      )
      .refine(
        (value) =>
          countSpecialCharacters(value) <= 15,
        {
          message:
            "Description can contain a maximum of 15 special characters",
        }
      )
      .refine(
        (value) =>
          countEmojis(value) <= 5,
        {
          message:
            "Description can contain a maximum of 5 emojis",
        }
      ),

    difficulty: z
      .coerce
      .number()
      .min(1)
      .max(5),

    basePoints: z
      .coerce
      .number()
      .min(0),

    economicBenefit: z
      .coerce
      .number()
      .positive()
      .optional()
      .transform((value) =>
        value
          ? Number(value.toFixed(2))
          : undefined
      ),

    participantsNeeded: z
      .coerce
      .number()
      .min(1)
      .max(10)
      .optional(),

    deadline: z
      .string()
      .datetime()
      .optional(),

    tagIds: z
      .array(z.string().transform(normalizeTag))
      .min(1)
      .max(5),
  });