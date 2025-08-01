import dotenv from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { Users, Customers, Products, Orders, OrderItems } from "./schema";

// Load environment variables
dotenv.config();

// Initialize Postgres pool with Xata connection URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

// Create Drizzle ORM instance with attached schema
export const db = drizzle(pool, {
  schema: {
    Users,
    Customers,
    Products,
    Orders,
    OrderItems,
  },
});
