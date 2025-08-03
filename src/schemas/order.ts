// src/schemas/orderSchema.ts
import { z } from "zod";

// Line-item schema
export const orderItemSchema = z.object({
  productId: z.string().min(1, "Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid unit price"),
  totalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid total price"),
});

// Schema for creating an order
export const createOrderSchema = z.object({
  orderDate: z.string().optional(), // ISO date string
  scheduledDeliveryDate: z.string().optional(), // ISO date string
  dateDelivered: z.string().optional(), // ISO date string
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  deliveryStreet: z.string().min(1, "Street is required"),
  deliveryCity: z.string().min(1, "City is required"),
  deliveryState: z.string().optional(),
  deliveryPostal: z.string().optional(),
  deliveryCountry: z.string().min(1, "Country is required"),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid total amount"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

// Schema for updating an order (all fields optional)
export const updateOrderSchema = createOrderSchema.partial();

// Export TS types
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
