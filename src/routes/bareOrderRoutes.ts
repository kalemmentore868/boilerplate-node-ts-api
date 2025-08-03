import { Router } from "express";

import { ensureLoggedIn } from "../middleware/auth";
import { getAllOrders } from "../controllers/orderController";

const router = Router();

// GET /orders
router.get("/", ensureLoggedIn, getAllOrders);

export default router;
