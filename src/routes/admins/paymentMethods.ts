import { Router } from "express";
import { getPaymentMethodById, getAllPaymentMethods } from "../../controllers/superadmin/paymentMethod";
import { catchAsync } from "../../utils/catchAsync";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();

router.get("/",checkPermission("paymentMethods","View"), catchAsync(getAllPaymentMethods));
router.get("/:id",checkPermission("paymentMethods","View"), catchAsync(getPaymentMethodById));

export default router;