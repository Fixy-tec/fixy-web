import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3900000000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

/** Login y registro con contraseña: frena fuerza bruta por IP. */
export const passwordAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  },
});

/** Pagos: evita que se prueben tarjetas en masa. */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos de pago. Espera unos minutos.",
  },
});
