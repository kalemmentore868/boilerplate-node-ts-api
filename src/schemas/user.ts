// src/schemas/userSchema.ts
import { z } from "zod";

// Base user fields
const userBase = z.object({
  username: z.string().min(1, "Username is required"),

  role: z.enum(["admin", "manager"], "Role must be either admin or manager"),
});

// For updates, all fields optional:
export const updateUserSchema = userBase.partial();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
