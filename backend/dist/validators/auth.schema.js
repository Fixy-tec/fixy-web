"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const text_utils_1 = require("../utils/text.utils");
/**
 * Registro libre: cualquier correo. El nombre sigue las mismas reglas que el
 * nombre de usuario del onboarding (`user.schema.ts`), para que no choquen.
 */
exports.registerSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .trim()
        .toLowerCase()
        .max(120, { message: "El correo es demasiado largo" })
        .email({ message: "Ingresa un correo válido" }),
    name: zod_1.z
        .string()
        .trim()
        .min(2, { message: "El nombre de usuario debe tener al menos 2 letras" })
        .max(15, { message: "El nombre de usuario no puede superar 15 letras" })
        .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/, {
        message: "El nombre de usuario solo puede tener letras (sin espacios)",
    })
        .refine((value) => !(0, text_utils_1.containsEmoji)(value), {
        message: "El nombre de usuario no puede tener emojis",
    })
        .transform((value) => (0, text_utils_1.normalizeUsername)(value)),
    password: zod_1.z
        .string()
        .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
        .max(64, { message: "La contraseña no puede superar 64 caracteres" })
        .regex(/^(?=.*[A-Za-z])(?=.*\d)/, {
        message: "La contraseña debe combinar letras y números",
    })
        .refine((value) => !(0, text_utils_1.containsEmoji)(value), {
        message: "La contraseña no puede tener emojis",
    }),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email({ message: "Ingresa un correo válido" }),
    password: zod_1.z.string().min(1, { message: "Ingresa tu contraseña" }).max(128),
});
