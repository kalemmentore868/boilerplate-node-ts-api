import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

// Enum types
export const userRole = pgEnum("user_role", ["admin", "manager"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const categories = pgEnum("category", [
  "trucks",
  "lego_sets",
  "scooters",
  "stuffed_animals",
  "dolls",
  "kitchen_sets",
  "jewelry_kits",
]);

// Users table (admins/managers)
export const Users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRole("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Customers table
export const Customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  street: varchar("street", { length: 200 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Products (toys) table
export const Products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: categories("category").notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Orders table
export const Orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => Customers.id),
  orderDate: timestamp("order_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  status: orderStatus("status").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  scheduledDeliveryDate: timestamp("scheduled_delivery_date", {
    withTimezone: true,
  })
    .default(sql`CURRENT_TIMESTAMP + INTERVAL '14 days'`) // or omit `.defaultNow()` and allow NULL
    .notNull(), // or drop `.notNull()` to make it nullable

  dateDelivered: timestamp("date_delivered", {
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP + INTERVAL '16 days'`),

  // shipping address, duplicated at time of order
  deliveryStreet: varchar("delivery_street", { length: 200 }).default(""),
  deliveryCity: varchar("delivery_city", { length: 100 }).default(""),
  deliveryState: varchar("delivery_state", { length: 100 }).default(""),
  deliveryPostal: varchar("delivery_postal", { length: 20 }).default(""),
  deliveryCountry: varchar("delivery_country", { length: 100 }).default(""),
});

// Order items (line items) table
export const OrderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => Orders.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => Products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
});
