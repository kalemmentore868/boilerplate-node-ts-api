import { Router } from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";
import {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
} from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../schemas/customer";

const router = Router();

// All routes require a valid token
router.use(authenticateJWT);

// GET /customers
router.get("/", ensureLoggedIn, getAllCustomers);

// GET /customers/:id
router.get(
  "/:id",
  ensureLoggedIn,

  getCustomerById
);

// POST /customers
router.post(
  "/",
  ensureLoggedIn,
  validate(createCustomerSchema),
  createCustomer
);

// PUT /customers/:id
router.put(
  "/:id",
  ensureLoggedIn,
  validate(updateCustomerSchema),
  updateCustomer
);

// DELETE /customers/:id (admin only)
router.delete("/:id", ensureAdmin, deleteCustomer);

export default router;
