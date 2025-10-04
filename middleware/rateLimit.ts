import rateLimit from "express-rate-limit";

export const limitAuthTight = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20, // 20 попыток/10 минут на IP
  standardHeaders: true,
  legacyHeaders: false,
});

export const limitAuthSoft = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
