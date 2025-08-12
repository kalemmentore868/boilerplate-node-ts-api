import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { corsMiddleware } from "./middleware/cors";
import { requestId } from "./middleware/requestId";
import helmet from "helmet";
import { httpLogger } from "./middleware/httpLogger";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter";
import { ExpressError, NotFoundError } from "./helpers/errors";

const app = express();

// If you’re behind a proxy/load balancer (Heroku, Nginx, etc.)
if (process.env.TRUST_PROXY)
  app.set("trust proxy", Number(process.env.TRUST_PROXY)); // e.g. 1

// Request id FIRST so everything can use it (logger, errors, etc.)
app.use(requestId);

// Logging
app.use(httpLogger);

// Security headers
app.use(
  helmet({
    // This API sends JSON; these defaults play nice.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(corsMiddleware);

app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(function (_req: Request, _res: Response, _next: NextFunction) {
  throw new NotFoundError();
});

app.use(function (
  err: ExpressError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message;
  const requestId = req.id; // set earlier by your requestId middleware

  return res.status(status).json({
    error: { message, status, requestId },
  });
});

export default app;
