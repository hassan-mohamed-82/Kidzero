import { Router } from 'express';
import { getPaymentById , getAllPayments , createPayment } from '../../controllers/admin/payment';
import { catchAsync } from '../../utils/catchAsync';


const router = Router();

router.get('/', catchAsync(getAllPayments));
router.get('/:id', catchAsync(getPaymentById));
router.post('/', catchAsync(createPayment));

export default router;
