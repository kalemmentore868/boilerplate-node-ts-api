// src/controllers/authController.ts
import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { Users } from "../db/schema";
import {
  BadRequestError,
  ExpressError,
  InternalServerError,
  UnauthorizedError,
} from "../helpers/errors";

const SALT_ROUNDS = 10;

export async function registerUser(req: Request, res: Response) {
  try {
    const { email, password, username, role } = req.body;
    if (!email || !password) {
      throw new BadRequestError("Email and password are required.");
    }
    // Check if email is taken
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(Users)
      .where(eq(Users.email, email))
      .execute();
    if (Number(count) > 0) {
      throw new BadRequestError("Email is already exists.");
    }
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    // Create user
    const [user] = await db
      .insert(Users)
      .values({
        email,
        passwordHash,
        username: username ?? "",
        role: role ?? "manager",
      })
      .returning();
    const returnedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    return res.status(201).json({
      message: "User registered successfully.",
      data: returnedUser,
    });
  } catch (error) {
    console.error("Registration error:", error);
    throw new InternalServerError("Failed to register user.");
  }
}

export async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError("Email and password are required.");
    }
    // Find user
    const [user] = await db
      .select()
      .from(Users)
      .where(eq(Users.email, email))
      .execute();
    if (!user) {
      throw new UnauthorizedError("Invalid credentials.");
    }
    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials.");
    }
    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    const data = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      token,
    };
    return res.json({ message: "Login successful", data });
  } catch (err: any) {
    console.error("Login error:", err);

    // If it's one of our ExpressError subclasses, re-throw it
    if (err instanceof ExpressError) {
      return next(err);
    }

    // Otherwise wrap in a 500
    return next(new InternalServerError("Failed to login."));
  }
}
