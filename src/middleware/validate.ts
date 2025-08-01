// src/middleware/validate.ts
import { z, ZodError, ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../helpers/errors";

export function validate(schema: ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const pretty = z.prettifyError(err);
        throw new BadRequestError(pretty);
      }
      next(err);
    }
  };
}
