import {Router } from 'express';
import { getAllPayments, getPaymentById, ReplyToPayment } from '../../controllers/superadmin/payment';
import { catchAsync } from '../../utils/catchAsync';
const router = Router();

router.get('/', catchAsync(getAllPayments));
router.get('/:id', catchAsync(getPaymentById));
router.put('/:id/reply', catchAsync(ReplyToPayment));

export default router;