import { Router } from "express";
import { getMySubscriptions, getSubscriptionById } from "../../controllers/admin/subscribtion";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router.get("/", catchAsync(getMySubscriptions));
router.get("/:id", catchAsync(getSubscriptionById));

export default router;