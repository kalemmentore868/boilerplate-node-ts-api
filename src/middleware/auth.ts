import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../helpers/errors";

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  //differs depending on you auth system, but set res.locals.user here
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
  const user = res.locals.user;
  if (!user) {
    return next(new UnauthorizedError("Authentication required"));
  }
  if (user.role !== "admin") {
    return next(new ForbiddenError("Admin privileges required"));
  }
  return next();
}
