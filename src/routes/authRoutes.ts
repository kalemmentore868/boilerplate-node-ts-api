import { Router } from "express";
import { registerUser, loginUser } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../schemas/auth";
import { ensureAdmin } from "../middleware/auth";

const router = Router();

router.post("/register", ensureAdmin, validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

export default router;
