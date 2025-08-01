// src/schemas/customerSchema.ts
import { z } from "zod";

// Schema for creating a customer
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required"),
  phone: z.string().min(1, "Phone is required"),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

// Schema for updating a customer (all fields optional)
export const updateCustomerSchema = createCustomerSchema.partial();

// Export types for TypeScript
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
