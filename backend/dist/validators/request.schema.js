"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestSchema = void 0;
const zod_1 = require("zod");
const text_utils_1 = require("../utils/text.utils");
const tag_utils_1 = require("../utils/tag.utils");
const text_utils_2 = require("../utils/text.utils");
const TITLE_REGEX = /^[A-Za-z0-9\s*\/.\-#!?]+$/u;
const DESCRIPTION_REGEX = /^[A-Za-z0-9\s*\/.\-#!?,¿¡\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u;
exports.createRequestSchema = zod_1.z.object({
    type: zod_1.z.enum([
        "ASESORIA",
        "PROYECTO",
    ]),
    title: zod_1.z
        .string()
        .min(5)
        .max(80)
        .transform((value) => (0, text_utils_1.normalizeText)(value))
        .refine((value) => TITLE_REGEX.test(value), {
        message: "Title contains invalid characters",
    })
        .refine((value) => !(0, text_utils_1.containsEmoji)(value), {
        message: "Title cannot contain emojis",
    })
        .refine((value) => (0, text_utils_2.countSpecialCharacters)(value) <= 5, {
        message: "Title can contain a maximum of 5 special characters",
    }),
    description: zod_1.z
        .string()
        .min(10)
        .max(1000)
        .transform((value) => (0, text_utils_1.normalizeText)(value))
        .refine((value) => DESCRIPTION_REGEX.test(value), {
        message: "Description contains invalid characters",
    })
        .refine((value) => (0, text_utils_2.countSpecialCharacters)(value) <= 15, {
        message: "Description can contain a maximum of 15 special characters",
    })
        .refine((value) => (0, text_utils_1.countEmojis)(value) <= 5, {
        message: "Description can contain a maximum of 5 emojis",
    }),
    difficulty: zod_1.z
        .coerce
        .number()
        .min(1)
        .max(5),
    basePoints: zod_1.z
        .coerce
        .number()
        .min(0),
    economicBenefit: zod_1.z
        .coerce
        .number()
        .positive()
        .optional()
        .transform((value) => value
        ? Number(value.toFixed(2))
        : undefined),
    participantsNeeded: zod_1.z
        .coerce
        .number()
        .min(1)
        .max(10)
        .optional(),
    deadline: zod_1.z
        .string()
        .datetime()
        .optional(),
    tags: zod_1.z
        .array(zod_1.z.string().transform(tag_utils_1.normalizeTag))
        .min(1)
        .max(5),
});
