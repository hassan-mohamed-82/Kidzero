import { Router } from 'express';
import { getPaymentById, getAllPayments, createPayment, requestRenewal, payPlanPrice } from '../../controllers/admin/payment';
import { catchAsync } from '../../utils/catchAsync';


const router = Router();

router.get('/', catchAsync(getAllPayments));
router.get('/:id', catchAsync(getPaymentById));
router.post('/', catchAsync(createPayment));
router.post('/renewal', catchAsync(requestRenewal));
router.post('/plan-price', catchAsync(payPlanPrice));

export default router;
