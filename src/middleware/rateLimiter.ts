import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

const json429 = (req: Request, res: Response) =>
  res.status(429).json({
    error: {
      message: "Too many requests, please try again later.",
      status: 429,
      requestId: req.id,
    },
  });

export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000), // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429 as any,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      error: {
        message: "Too many login attempts. Try again later.",
        status: 429,
        requestId: req.id,
      },
    }),
});
