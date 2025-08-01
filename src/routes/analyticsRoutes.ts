import { Router } from "express";
import { authenticateJWT, ensureLoggedIn } from "../middleware/auth";
import { getDashboard } from "../controllers/analyticsController";

const router = Router();

// Require valid token and login
router.use(authenticateJWT, ensureLoggedIn);

// GET /dashboard
router.get("/", getDashboard);

export default router;
