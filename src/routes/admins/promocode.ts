import { Router } from "express";
import { verifyPromocode } from "../../controllers/admin/promocodes";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router.post("/verify", catchAsync(verifyPromocode));

export default router;
