// src/routes/orderRoutes.ts
import { Router } from "express";
import {
  getOrdersForCustomer,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController";
import { ensureLoggedIn } from "../middleware/auth";

const router = Router({ mergeParams: true });

/**
 * GET    /customers/:customerId/orders
 * POST   /customers/:customerId/orders
 */
router
  .route("/")
  .get(ensureLoggedIn, getOrdersForCustomer)
  .post(ensureLoggedIn, createOrder);

/**
 * GET    /customers/:customerId/orders/:id
 * PUT    /customers/:customerId/orders/:id
 * DELETE /customers/:customerId/orders/:id
 */
router
  .route("/:id")
  .get(ensureLoggedIn, getOrderById)
  .put(ensureLoggedIn, updateOrder)
  .delete(ensureLoggedIn, deleteOrder);

export default router;
