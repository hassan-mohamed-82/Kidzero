import { Router } from "express";
import { getHomeDashboard } from "../../controllers/admin/dashboard";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router.get("/", catchAsync(getHomeDashboard));

export default router;

