import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { Customers } from "../db/schema";
import { NotFoundError, BadRequestError } from "../helpers/errors";
import { eq, sql } from "drizzle-orm";
import { validate as isUUID } from "uuid";

export async function getAllCustomers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const customers = await db.select().from(Customers).execute();
    return res.json({
      message: "Customers retrieved successfully.",
      data: customers,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getCustomerById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!isUUID(id)) {
      throw new NotFoundError(`Customer not found: ${id}`);
    }
    const [customer] = await db
      .select()
      .from(Customers)
      .where(eq(Customers.id, id))
      .execute();
    if (!customer) throw new NotFoundError(`Customer not found: ${id}`);
    return res.json({
      message: "Customer retrieved successfully.",
      data: customer,
    });
  } catch (err) {
    return next(err);
  }
}

export async function createCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, email, phone, street, city, state, postalCode, country } =
      req.body;
    if (!name || !email)
      throw new BadRequestError("Name and email are required.");

    // Ensure unique email
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(Customers)
      .where(eq(Customers.email, email))
      .execute();
    if (Number(count) > 0) throw new BadRequestError("Email already exists.");

    const [customer] = await db
      .insert(Customers)
      .values({ name, email, phone, street, city, state, postalCode, country })
      .returning();
    return res.status(201).json({
      message: "Customer created successfully.",
      data: customer,
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!isUUID(id)) {
      throw new NotFoundError(`Customer not found: ${id}`);
    }

    // Check exists
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(Customers)
      .where(eq(Customers.id, id))
      .execute();
    if (Number(count) === 0)
      throw new NotFoundError(`Customer not found: ${id}`);

    const [customer] = await db
      .update(Customers)
      .set(data)
      .where(eq(Customers.id, id))
      .returning();
    return res.json({
      message: "Customer updated successfully.",
      data: customer,
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!isUUID(id)) {
      throw new NotFoundError(`Customer not found: ${id}`);
    }
    const result = await db
      .delete(Customers)
      .where(eq(Customers.id, id))
      .execute();
    if (result.rowCount === 0)
      throw new NotFoundError(`Customer not found: ${id}`);
    return res.json({
      message: "Customer deleted successfully.",
      data: id,
    });
  } catch (err) {
    return next(err);
  }
}
