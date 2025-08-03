// src/routes/productRoutes.ts
import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { ensureLoggedIn } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createProductSchema } from "../schemas/products";

const router = Router();

router
  .route("/")
  .get(ensureLoggedIn, getAllProducts)
  .post(ensureLoggedIn, validate(createProductSchema), createProduct);

router
  .route("/:id")
  .get(ensureLoggedIn, getProductById)
  .put(ensureLoggedIn, updateProduct)
  .delete(ensureLoggedIn, deleteProduct);

export default router;
