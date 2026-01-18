import { Router } from "express";
import { getMySubscriptions, getSubscriptionById } from "../../controllers/admin/subscribtion";
import { catchAsync } from "../../utils/catchAsync";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();

router.get("/",checkPermission("Subscription","View"), catchAsync(getMySubscriptions));
router.get("/:id",checkPermission("Subscription","View"), catchAsync(getSubscriptionById));

export default router;