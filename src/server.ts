import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes";
import customerRoutes from "./routes/customerRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import { ExpressError, NotFoundError } from "./helpers/errors";
import { authenticateJWT } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5500;

app.use(cors());

app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(authenticateJWT);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Root
app.get("/", (_req, res) => {
  res.send("Welcome to the Toy Store API");
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
