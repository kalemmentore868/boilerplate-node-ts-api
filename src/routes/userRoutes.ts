// src/routes/userRoutes.ts
import { Router } from "express";
import {
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { ensureAdmin, ensureLoggedIn } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateUserSchema } from "../schemas/user";

const router = Router();

router.get("/", ensureLoggedIn, listUsers);
router.get("/:id", ensureLoggedIn, getUserById);
router.put("/:id", ensureAdmin, validate(updateUserSchema), updateUser);
router.delete("/:id", ensureAdmin, deleteUser);

export default router;
