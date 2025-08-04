import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes";
import customerRoutes from "./routes/customerRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import orderRoutes from "./routes/orderRoutes";
import bareOrderRoutes from "./routes/bareOrderRoutes";
import productRoutes from "./routes/productRoutes";
import reportRoutes from "./routes/reportRoutes";
import userRoutes from "./routes/userRoutes";
import { ExpressError, NotFoundError } from "./helpers/errors";
import { authenticateJWT } from "./middleware/auth";

const app = express();

app.use(cors());

app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(authenticateJWT);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/customers/:customerId/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/orders", bareOrderRoutes);
app.use("/api/users", userRoutes);

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

export default app;
