// src/controllers/dashboardController.ts
import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { Customers, Orders, OrderItems, Products } from "../db/schema";
import { sql, eq } from "drizzle-orm";

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1) Total customers
    const [{ count: customerCount }] = await db
      .select({ count: sql<string>`COUNT(*)` })
      .from(Customers)
      .execute();
    const totalCustomers = parseInt(customerCount, 10);

    // 2) Orders this year grouped by day
    const ordersRaw = await db
      .select({
        day: sql<string>`TO_CHAR(DATE_TRUNC('day', ${Orders.orderDate}), 'YYYY-MM-DD')`,
        count: sql<string>`COUNT(*)`,
      })
      .from(Orders)
      .where(sql`${Orders.orderDate} >= NOW() - INTERVAL '1 year'`)
      .groupBy(sql`DATE_TRUNC('day', ${Orders.orderDate})`)
      .orderBy(sql`DATE_TRUNC('day', ${Orders.orderDate})`)
      .execute();

    const ordersByDay = ordersRaw.map((r) => ({
      day: r.day,
      count: parseInt(r.count, 10),
    }));

    // 3) Order locations (count by country)
    const locRaw = await db
      .select({
        country: Orders.deliveryCountry,
        count: sql<string>`COUNT(*)`,
      })
      .from(Orders)
      .groupBy(Orders.deliveryCountry)
      .execute();
    const locationData = locRaw.map((r) => ({
      country: r.country,
      count: parseInt(r.count, 10),
    }));

    // 4) Distribution of toy categories
    const distRaw = await db
      .select({
        category: Products.category,
        count: sql<string>`SUM(${OrderItems.quantity})`,
      })
      .from(OrderItems)
      .innerJoin(Products, eq(OrderItems.productId, Products.id))
      .groupBy(Products.category)
      .execute();
    const typeDistribution = distRaw.map((r) => ({
      category: r.category,
      count: parseInt(r.count, 10),
    }));

    return res.json({
      message: "Dashboard data retrieved successfully.",
      data: {
        totalCustomers,
        ordersByDay,
        locationData,
        typeDistribution,
      },
    });
  } catch (err) {
    return next(err);
  }
}
