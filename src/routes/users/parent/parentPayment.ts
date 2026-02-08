import { Router } from "express";
import {
    getParentPayments,
    getParentPaymentbyId,
    getparentInstallments,
    getparentInstallmentById,
    createParentPayment,
    createParentPaymentOrgService,
    payServiceInstallment
} from "../../../controllers/users/parent/payment";
import { catchAsync } from "../../../utils/catchAsync";
const router = Router();


router.get("/", catchAsync(getParentPayments));
router.get("/:id", catchAsync(getParentPaymentbyId));
router.post("/", catchAsync(createParentPayment));
router.post("/org-service", catchAsync(createParentPaymentOrgService));
router.post("/pay-installment", catchAsync(payServiceInstallment));
router.get("/installments", catchAsync(getparentInstallments));
router.get("/installments/:id", catchAsync(getparentInstallmentById));
export default router;