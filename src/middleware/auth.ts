// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../helpers/errors";

interface JwtPayload {
  id: string;
  role: string;
  username: string;
  email: string;
}

/** Middleware: Authenticate user.
 *  If a token is provided, verify it and store payload on res.locals.user.
 *  It's not an error if no token is provided; downstream checks will enforce login. */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^[Bb]earer\s+/i, "").trim();
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
      res.locals.user = payload;
    } catch (err) {
      // invalid token, ignore
    }
  }
  return next();
}

/** Middleware: require login. */
export function ensureLoggedIn(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (!res.locals.user) {
    return next(new UnauthorizedError("Authentication required"));
  }
  return next();
}

/** Middleware: require admin role. */
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user as JwtPayload | undefined;
  if (!user) {
    return next(new UnauthorizedError("Authentication required"));
  }
  if (user.role !== "admin") {
    return next(new ForbiddenError("Admin privileges required"));
  }
  return next();
}
