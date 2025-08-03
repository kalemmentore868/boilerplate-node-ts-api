import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { Users } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { NotFoundError, BadRequestError } from "../helpers/errors";

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const users = await db
      .select({
        id: Users.id,
        username: Users.username,
        email: Users.email,
        role: Users.role,
        createdAt: Users.createdAt,
        updatedAt: Users.updatedAt,
      })
      .from(Users)
      .execute();

    return res.json({
      message: "Users retrieved successfully.",
      data: users,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/:id
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const [user] = await db
      .select({
        id: Users.id,
        username: Users.username,
        email: Users.email,
        role: Users.role,
        createdAt: Users.createdAt,
        updatedAt: Users.updatedAt,
      })
      .from(Users)
      .where(eq(Users.id, id))
      .execute();

    if (!user) throw new NotFoundError(`User not found: ${id}`);

    return res.json({
      message: "User retrieved successfully.",
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /users/:id
 * body: Partial<Users>
 */
export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const data = req.body;

    // You might want to whitelist which fields can be updated:
    // e.g. const { email, name, role } = req.body;

    // Ensure user exists
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(Users)
      .where(eq(Users.id, id))
      .execute();

    if (Number(count) === 0) {
      throw new NotFoundError(`User not found: ${id}`);
    }

    const [updated] = await db
      .update(Users)
      .set(data)
      .where(eq(Users.id, id))
      .returning();

    return res.json({
      message: "User updated successfully.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    // attempt deletion
    const result = await db.delete(Users).where(eq(Users.id, id)).execute();

    if (result.rowCount === 0) {
      // nothing was deleted → user didn't exist
      throw new NotFoundError(`User not found: ${id}`);
    }

    return res.json({
      message: "User deleted successfully.",
      data: id,
    });
  } catch (err) {
    next(err);
  }
}
