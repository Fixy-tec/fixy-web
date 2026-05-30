"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const text_utils_1 = require("../utils/text.utils");
const BIO_REGEX = /^[A-Za-z0-9\s*.,\-/#@!?¿¡\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u;
/** Acepta URL absoluta (http/https) o path absoluto local (`/avatars/...`). */
const urlOrAbsolutePath = zod_1.z
    .string()
    .refine((value) => {
    if (value.startsWith("/"))
        return true;
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
}, { message: "Must be a valid URL or absolute path" });
exports.updateProfileSchema = zod_1.z.object({
    /** Mismas reglas que `auth.schema.ts > registerSchema.name` */
    name: zod_1.z
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
        .refine((value) => !(0, text_utils_1.containsEmoji)(value), {
        message: "Username cannot contain emojis",
    })
        .transform((value) => (0, text_utils_1.normalizeUsername)(value))
        .optional(),
    whatsapp: zod_1.z
        .string()
        .regex(/^(?:\+51)?9\d{8}$/, {
        message: "Invalid WhatsApp number",
    }),
    bio: zod_1.z
        .string()
        .min(10)
        .max(300)
        .transform((value) => (0, text_utils_1.normalizeText)(value))
        .refine((value) => BIO_REGEX.test(value), {
        message: "Bio contains invalid characters",
    })
        .refine((value) => (0, text_utils_1.countEmojis)(value) <= 5, {
        message: "Bio can contain a maximum of 5 emojis",
    })
        .optional(),
    avatarUrl: urlOrAbsolutePath.optional(),
    portfolioUrl: zod_1.z
        .url()
        .optional(),
    linkedinUrl: zod_1.z
        .url()
        .optional(),
    githubUrl: zod_1.z
        .url()
        .optional(),
    tagIds: zod_1.z
        .array(zod_1.z.string())
        .max(5, {
        message: "Maximum 5 tags allowed",
    })
        .optional(),
});
