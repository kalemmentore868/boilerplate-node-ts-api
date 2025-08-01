import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { OrderItems } from "../db/schema";
import { NotFoundError, BadRequestError } from "../helpers/errors";
import { eq, sql } from "drizzle-orm";

// GET /customers/:customerId/orders/:orderId/items
export async function getItemsForOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { customerId, orderId } = req.params;
    const items = await db
      .select()
      .from(OrderItems)
      .where(
        sql`${OrderItems.orderId} = ${orderId} AND EXISTS (
          SELECT 1 FROM orders o 
          WHERE o.id = ${orderId} AND o.customer_id = ${customerId}
        )`
      )
      .execute();
    return res.json({
      message: "Order items retrieved successfully.",
      data: items,
    });
  } catch (err) {
    return next(err);
  }
}

// GET /customers/:customerId/orders/:orderId/items/:id
export async function getItemById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { customerId, orderId, id } = req.params;
    const [item] = await db
      .select()
      .from(OrderItems)
      .where(
        sql`${OrderItems.id} = ${id} AND ${OrderItems.orderId} = ${orderId} AND EXISTS (
          SELECT 1 FROM orders o 
          WHERE o.id = ${orderId} AND o.customer_id = ${customerId}
        )`
      )
      .execute();
    if (!item) throw new NotFoundError(`Order item not found: ${id}`);
    return res.json({
      message: "Order item retrieved successfully.",
      data: item,
    });
  } catch (err) {
    return next(err);
  }
}

// POST /customers/:customerId/orders/:orderId/items
export async function createOrderItem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { customerId, orderId } = req.params;
    const { productId, quantity, unitPrice, totalPrice } = req.body;

    if (!productId || quantity == null || !unitPrice || !totalPrice) {
      throw new BadRequestError(
        "productId, quantity, unitPrice, and totalPrice are required."
      );
    }

    // ensure order belongs to customer
    const [{ count: orderCount }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(sql`orders`)
      .where(sql`id = ${orderId} AND customer_id = ${customerId}`)
      .execute();
    if (Number(orderCount) === 0)
      throw new NotFoundError(`Order not found: ${orderId}`);

    const [item] = await db
      .insert(OrderItems)
      .values({ orderId, productId, quantity, unitPrice, totalPrice })
      .returning();

    return res
      .status(201)
      .json({ message: "Order item created successfully.", data: item });
  } catch (err) {
    return next(err);
  }
}

// PUT /customers/:customerId/orders/:orderId/items/:id
export async function updateOrderItem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { customerId, orderId, id } = req.params;
    const data = req.body;

    // ensure exists and belongs
    const [{ count: existsCount }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(OrderItems)
      .where(
        sql`${OrderItems.id} = ${id} AND ${OrderItems.orderId} = ${orderId} AND EXISTS (
          SELECT 1 FROM orders o 
          WHERE o.id = ${orderId} AND o.customer_id = ${customerId}
        )`
      )
      .execute();
    if (Number(existsCount) === 0)
      throw new NotFoundError(`Order item not found: ${id}`);

    const [item] = await db
      .update(OrderItems)
      .set(data)
      .where(eq(OrderItems.id, id))
      .returning();

    return res.json({
      message: "Order item updated successfully.",
      data: item,
    });
  } catch (err) {
    return next(err);
  }
}

// DELETE /customers/:customerId/orders/:orderId/items/:id
export async function deleteOrderItem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { customerId, orderId, id } = req.params;
    const result = await db
      .delete(OrderItems)
      .where(
        sql`${OrderItems.id} = ${id} AND ${OrderItems.orderId} = ${orderId} AND EXISTS (
          SELECT 1 FROM orders o 
          WHERE o.id = ${orderId} AND o.customer_id = ${customerId}
        )`
      )
      .execute();
    if (result.rowCount === 0)
      throw new NotFoundError(`Order item not found: ${id}`);
    return res.json({ message: "Order item deleted successfully.", data: id });
  } catch (err) {
    return next(err);
  }
}
