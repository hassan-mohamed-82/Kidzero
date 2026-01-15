import { Router } from "express";
import { getPaymentMethodById, getAllPaymentMethods } from "../../controllers/superadmin/paymentMethod";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router.get("/", catchAsync(getAllPaymentMethods));
router.get("/:id", catchAsync(getPaymentMethodById));

export default router;