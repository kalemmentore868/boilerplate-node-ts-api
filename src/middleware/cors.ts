import cors, { CorsOptions } from "cors";

const allowlist = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // non-browser clients
    return allowlist.includes(origin)
      ? cb(null, true)
      : cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);
