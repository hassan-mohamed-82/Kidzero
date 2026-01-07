import {Router} from 'express';
import { getAllPaymentMethods, getPaymentMethodById, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '../../controllers/superadmin/paymentMethod';
import { catchAsync } from '../../utils/catchAsync';
const router = Router();

router.get('/', catchAsync(getAllPaymentMethods));
router.post('/', catchAsync(createPaymentMethod));
router.get('/:id', catchAsync(getPaymentMethodById));
router.put('/:id', catchAsync(updatePaymentMethod));
router.delete('/:id', catchAsync(deletePaymentMethod));

export default router;