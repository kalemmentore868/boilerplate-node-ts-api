import type { RequestHandler } from "express";
import { randomUUID } from "crypto";

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = (req.header("x-request-id") as string) || randomUUID();
  req.id = incoming;
  res.setHeader("X-Request-Id", incoming);
  next();
};
