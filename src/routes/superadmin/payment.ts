import { Router } from 'express';
import {
    getAllPayments,
    getPaymentById,
    ReplyToPayment,
    getAllInstallments,
    getInstallmentById,
    approveInstallment,
    rejectInstallment
} from '../../controllers/superadmin/payment';
import { catchAsync } from '../../utils/catchAsync';
const router = Router();

// Payment routes
router.get('/', catchAsync(getAllPayments));
router.get('/:id', catchAsync(getPaymentById));
router.put('/:id/reply', catchAsync(ReplyToPayment));

// Installment routes
router.get('/installments/all', catchAsync(getAllInstallments));
router.get('/installments/:id', catchAsync(getInstallmentById));
router.put('/installments/:id/approve', catchAsync(approveInstallment));
router.put('/installments/:id/reject', catchAsync(rejectInstallment));

export default router;