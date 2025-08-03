// src/schemas/productSchema.ts
import { z } from "zod";

// Define your allowed categories (must match your DB enum):
export const productCategoryEnum = z.enum([
  "trucks",
  "lego_sets",
  "scooters",
  "stuffed_animals",
  "dolls",
  "kitchen_sets",
  "jewelry_kits",
]);

// Schema for creating a product
export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format (e.g. 12.34)")
    .or(z.number().nonnegative())
    .transform((v) => v.toString()),
  category: productCategoryEnum,
  imageUrl: z.string().optional().nullable(),
  stockQuantity: z
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative"),
});

// Schema for updating — all fields optional
export const updateProductSchema = createProductSchema.partial();

// Export TypeScript types
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
