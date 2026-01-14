import e, { Router } from "express";
import { getParentPayments, getParentPaymentbyId, createParentPayment } from "../../../controllers/users/parent/payment";

const router = Router();


router.get("/", getParentPayments);
router.get("/:id", getParentPaymentbyId);
router.post("/", createParentPayment);

export default router;