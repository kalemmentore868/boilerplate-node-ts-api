import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { Orders } from "../db/schema";
import { NotFoundError, BadRequestError } from "../helpers/errors";
import { eq, sql } from "drizzle-orm";

// GET /customers/:customerId/orders
export async function getOrdersForCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { customerId } = req.params;
    const orders = await db
      .select()
      .from(Orders)
      .where(eq(Orders.customerId, customerId))
      .execute();
    return res.json({
      message: "Orders retrieved successfully.",
      data: orders,
    });
  } catch (err) {
    return next(err);
  }
}

// GET /customers/:customerId/orders/:id
export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, customerId } = req.params;
    const [order] = await db
      .select()
      .from(Orders)
      .where(sql`${Orders.id} = ${id} AND ${Orders.customerId} = ${customerId}`)
      .execute();
    if (!order) throw new NotFoundError(`Order not found: ${id}`);
    return res.json({
      message: "Order retrieved successfully.",
      data: order,
    });
  } catch (err) {
    return next(err);
  }
}

// POST /customers/:customerId/orders
export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { customerId } = req.params;
    const {
      orderDate,
      scheduledDeliveryDate,
      deliveryStreet,
      deliveryCity,
      deliveryState,
      deliveryPostal,
      deliveryCountry,
      status,
      totalAmount,
    } = req.body;

    if (
      !status ||
      !totalAmount ||
      !deliveryStreet ||
      !deliveryCity ||
      !deliveryCountry
    ) {
      throw new BadRequestError(
        "status, totalAmount, deliveryStreet, deliveryCity, and deliveryCountry are required."
      );
    }

    const [order] = await db
      .insert(Orders)
      .values({
        customerId,
        orderDate: orderDate ?? sql`NOW()`,
        scheduledDeliveryDate:
          scheduledDeliveryDate ?? sql`NOW() + INTERVAL '14 days'`,
        deliveryStreet,
        deliveryCity,
        deliveryState: deliveryState ?? "",
        deliveryPostal: deliveryPostal ?? "",
        deliveryCountry,
        status,
        totalAmount,
      })
      .returning();

    return res.status(201).json({
      message: "Order created successfully.",
      data: order,
    });
  } catch (err) {
    return next(err);
  }
}

// PUT /customers/:customerId/orders/:id
export async function updateOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, customerId } = req.params;
    const data = req.body;

    // ensure exists
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(Orders)
      .where(sql`${Orders.id} = ${id} AND ${Orders.customerId} = ${customerId}`)
      .execute();
    if (Number(count) === 0) throw new NotFoundError(`Order not found: ${id}`);

    const [order] = await db
      .update(Orders)
      .set(data)
      .where(sql`${Orders.id} = ${id} AND ${Orders.customerId} = ${customerId}`)
      .returning();

    return res.json({
      message: "Order updated successfully.",
      data: order,
    });
  } catch (err) {
    return next(err);
  }
}

// DELETE /customers/:customerId/orders/:id
export async function deleteOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, customerId } = req.params;
    const result = await db
      .delete(Orders)
      .where(sql`${Orders.id} = ${id} AND ${Orders.customerId} = ${customerId}`)
      .execute();
    if (result.rowCount === 0) {
      throw new NotFoundError(`Order not found: ${id}`);
    }
    return res.json({
      message: "Order deleted successfully.",
      data: id,
    });
  } catch (err) {
    return next(err);
  }
}
