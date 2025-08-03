// src/controllers/productController.ts
import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { Products } from "../db/schema";
import { NotFoundError, BadRequestError } from "../helpers/errors";
import { eq, sql } from "drizzle-orm";

/**
 * GET /products
 */
export async function getAllProducts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const products = await db.select().from(Products).execute();
    return res.json({
      message: "Products retrieved successfully.",
      data: products,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /products/:id
 */
export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const [product] = await db
      .select()
      .from(Products)
      .where(eq(Products.id, id))
      .execute();
    if (!product) throw new NotFoundError(`Product not found: ${id}`);
    return res.json({
      message: "Product retrieved successfully.",
      data: product,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /products
 */
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, price, category, description, imageUrl, stockQuantity } =
      req.body;

    if (!name || price == null || !category) {
      throw new BadRequestError("Name, price, and category are required.");
    }

    // ensure unique name
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(Products)
      .where(eq(Products.name, name))
      .execute();
    if (Number(count) > 0) {
      throw new BadRequestError(`Product name already exists: ${name}`);
    }

    const [product] = await db
      .insert(Products)
      .values({
        name,
        description: description ?? "",
        price,
        category,
        imageUrl: imageUrl ?? "",
        stockQuantity: stockQuantity ?? 0,
      })
      .returning();

    return res.status(201).json({
      message: "Product created successfully.",
      data: product,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /products/:id
 */
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const data = req.body;

    // ensure exists
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(Products)
      .where(eq(Products.id, id))
      .execute();
    if (Number(count) === 0) {
      throw new NotFoundError(`Product not found: ${id}`);
    }

    const [product] = await db
      .update(Products)
      .set(data)
      .where(eq(Products.id, id))
      .returning();

    return res.json({
      message: "Product updated successfully.",
      data: product,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /products/:id
 */
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const result = await db
      .delete(Products)
      .where(eq(Products.id, id))
      .execute();
    if (result.rowCount === 0) {
      throw new NotFoundError(`Product not found: ${id}`);
    }
    return res.json({
      message: "Product deleted successfully.",
      data: id,
    });
  } catch (err) {
    return next(err);
  }
}
