import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { OrderItems, Orders, Products } from "../db/schema";
import { NotFoundError, BadRequestError } from "../helpers/errors";
import { eq, InferInsertModel, sql } from "drizzle-orm";

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

    // 1️⃣ Fetch the order itself
    const [order] = await db
      .select()
      .from(Orders)
      .where(sql`${Orders.id} = ${id} AND ${Orders.customerId} = ${customerId}`)
      .execute();

    if (!order) {
      throw new NotFoundError(`Order not found: ${id}`);
    }

    // 2️⃣ Fetch its items joined with product info
    const items = await db
      .select({
        id: OrderItems.id,
        orderId: OrderItems.orderId,
        productId: OrderItems.productId,
        quantity: OrderItems.quantity,
        unitPrice: OrderItems.unitPrice,
        totalPrice: OrderItems.totalPrice,
        productName: Products.name,
      })
      .from(OrderItems)
      .innerJoin(Products, eq(OrderItems.productId, Products.id))
      .where(eq(OrderItems.orderId, id))
      .execute();

    // 3️⃣ Return both in one response
    return res.json({
      message: "Order retrieved successfully.",
      data: {
        order,
        items,
      },
    });
  } catch (err) {
    return next(err);
  }
}

type NewOrderDB = InferInsertModel<typeof Orders>;

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
      dateDelivered,
      deliveryStreet,
      deliveryCity,
      deliveryState,
      deliveryPostal,
      deliveryCountry,
      status,
      totalAmount,
      items,
    } = req.body as {
      orderDate?: string;
      scheduledDeliveryDate?: string;
      dateDelivered?: string;
      deliveryStreet: string;
      deliveryCity: string;
      deliveryState?: string;
      deliveryPostal?: string;
      deliveryCountry: string;
      status: string;
      totalAmount: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: string;
        totalPrice: string;
      }>;
    };

    // Basic validation
    if (
      !status ||
      !totalAmount ||
      !deliveryStreet ||
      !deliveryCity ||
      !deliveryCountry ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new BadRequestError(
        "status, totalAmount, deliveryStreet, deliveryCity, deliveryCountry, and a non-empty items array are required."
      );
    }

    // Transaction: insert order, then items
    const [insertedOrder] = await db.transaction(async (tx) => {
      // Build a typed payload for the Orders table
      const orderPayload: NewOrderDB = {
        customerId,
        ...(orderDate && { orderDate: new Date(orderDate) }),
        ...(scheduledDeliveryDate && {
          scheduledDeliveryDate: new Date(scheduledDeliveryDate),
        }),
        dateDelivered: dateDelivered ? new Date(dateDelivered) : null,
        deliveryStreet,
        deliveryCity,
        deliveryState: deliveryState ?? "",
        deliveryPostal: deliveryPostal ?? "",
        deliveryCountry,
        status: status as NewOrderDB["status"],
        totalAmount,
      };

      const [order] = await tx.insert(Orders).values(orderPayload).returning();

      // Bulk insert items
      await tx
        .insert(OrderItems)
        .values(
          items.map((it) => ({
            orderId: order.id,
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
          }))
        )
        .execute();

      return [order];
    });

    return res.status(201).json({
      message: "Order (and items) created successfully.",
      data: insertedOrder,
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
    const {
      orderDate,
      scheduledDeliveryDate,
      dateDelivered,
      deliveryStreet,
      deliveryCity,
      deliveryState,
      deliveryPostal,
      deliveryCountry,
      status,
      totalAmount,
      items,
    } = req.body as {
      orderDate?: string;
      scheduledDeliveryDate?: string;
      dateDelivered?: string;
      deliveryStreet?: string;
      deliveryCity?: string;
      deliveryState?: string;
      deliveryPostal?: string;
      deliveryCountry?: string;
      status?: string;
      totalAmount?: string;
      items?: Array<{
        productId: string;
        quantity: number;
        unitPrice: string;
        totalPrice: string;
      }>;
    };

    // Ensure order exists
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(Orders)
      .where(sql`${Orders.id} = ${id} AND ${Orders.customerId} = ${customerId}`)
      .execute();
    if (Number(count) === 0) {
      throw new NotFoundError(`Order not found: ${id}`);
    }

    // Basic validation if items provided
    if (items && (!Array.isArray(items) || items.length === 0)) {
      throw new BadRequestError(`Items array, if provided, must be non-empty.`);
    }

    // Transaction: update order, replace items
    const [updatedOrder] = await db.transaction(async (tx) => {
      // Build an update payload only with provided fields
      const updatePayload: Partial<NewOrderDB> = {
        ...(orderDate && { orderDate: new Date(orderDate) }),
        ...(scheduledDeliveryDate && {
          scheduledDeliveryDate: new Date(scheduledDeliveryDate),
        }),
        ...(dateDelivered && { dateDelivered: new Date(dateDelivered) }),
        ...(deliveryStreet !== undefined && { deliveryStreet }),
        ...(deliveryCity !== undefined && { deliveryCity }),
        ...(deliveryState !== undefined && { deliveryState }),
        ...(deliveryPostal !== undefined && { deliveryPostal }),
        ...(deliveryCountry !== undefined && { deliveryCountry }),
        ...(status !== undefined && {
          status: status as NewOrderDB["status"],
        }),
        ...(totalAmount !== undefined && { totalAmount }),
      };

      // 1️⃣ Update the Orders row
      const [orderRow] = await tx
        .update(Orders)
        .set(updatePayload)
        .where(
          sql`${Orders.id} = ${id} AND ${Orders.customerId} = ${customerId}`
        )
        .returning();

      // 2️⃣ If items provided, delete existing and insert new ones
      if (items) {
        await tx
          .delete(OrderItems)
          .where(sql`${OrderItems.orderId} = ${id}`)
          .execute();

        await tx
          .insert(OrderItems)
          .values(
            items.map((it) => ({
              orderId: orderRow.id,
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
            }))
          )
          .execute();
      }

      return [orderRow];
    });

    return res.json({
      message: "Order updated successfully.",
      data: updatedOrder,
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

export async function getAllOrders(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const orders = await db.select().from(Orders).execute();
    return res.json({
      message: "Orders retrieved successfully.",
      data: orders,
    });
  } catch (err) {
    return next(err);
  }
}
