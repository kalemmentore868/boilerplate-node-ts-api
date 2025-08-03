import { Router } from "express";
import { generateCustomerReportPDF } from "../controllers/reportsController";
import { ensureLoggedIn } from "../middleware/auth";

const router = Router();
router.get("/customer/:id/pdf", ensureLoggedIn, generateCustomerReportPDF);
export default router;
