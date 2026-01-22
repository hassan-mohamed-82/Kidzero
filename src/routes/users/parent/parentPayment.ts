import { Router } from "express";
import { getParentPayments, getParentPaymentbyId, createParentPayment ,createParentPaymentOrgService } from "../../../controllers/users/parent/payment";
import { catchAsync } from "../../../utils/catchAsync";
const router = Router();


router.get("/", catchAsync(getParentPayments));
router.get("/:id", catchAsync(getParentPaymentbyId));
router.post("/", catchAsync(createParentPayment));
router.post("/org-service", catchAsync(createParentPaymentOrgService));
export default router;