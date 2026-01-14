import { Router } from "express";
import { getParentPayments, getParentPaymentbyId, createParentPayment } from "../../../controllers/users/parent/payment";
import { catchAsync } from "../../../utils/catchAsync";
const router = Router();


router.get("/", catchAsync(getParentPayments));
router.get("/:id", catchAsync(getParentPaymentbyId));
router.post("/", catchAsync(createParentPayment));

export default router;