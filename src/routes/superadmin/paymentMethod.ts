import {Router} from 'express';
import { getAllPaymentMethods, getPaymentMethodById, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '../../controllers/superadmin/paymentMethod';
import { catchAsync } from '../../utils/catchAsync';
import { validate } from '../../middlewares/validation';
import { createPaymentMethodSchema, updatePaymentMethodSchema } from '../../validators/superadmin/paymentMethod';
const router = Router();

router.get('/', catchAsync(getAllPaymentMethods));
router.post('/', validate(createPaymentMethodSchema), catchAsync(createPaymentMethod));
router.get('/:id', catchAsync(getPaymentMethodById));
router.put('/:id', validate(updatePaymentMethodSchema), catchAsync(updatePaymentMethod));
router.delete('/:id', catchAsync(deletePaymentMethod));

export default router;