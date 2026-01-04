import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import {
  getHeader,
  getRejectUser,
  complaintsCategories,
} from "../../controllers/admin/dashborad";
const router = Router();
router.get("/header", catchAsync(getHeader));
router.get("/rejectUsers", catchAsync(getRejectUser));
router.get("/complaints-analysis", catchAsync(complaintsCategories));
export default router;
