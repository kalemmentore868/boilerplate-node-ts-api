import { z } from "zod";

export const registerSchema = z.object({
  email: z.string(),
  password: z.string(), // at least 8 chars
  username: z.string(), // allow empty or missing
  role: z.enum(["admin", "manager"]),
});

export const loginSchema = z.object({
  email: z.string(),
  password: z.string().min(1),
});
