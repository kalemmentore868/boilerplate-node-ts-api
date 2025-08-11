import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { ExpressError, NotFoundError } from "./helpers/errors";

const app = express();

app.use(cors());

app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(function (_req: Request, _res: Response, _next: NextFunction) {
  throw new NotFoundError();
});

app.use(function (
  err: ExpressError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

export default app;
