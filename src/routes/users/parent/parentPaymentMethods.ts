import {Router} from 'express';
import { getAllPaymentMethods, getPaymentMethodById } from '../../../controllers/superadmin/paymentMethod';
import { catchAsync } from '../../../utils/catchAsync';
const router = Router();

router.get('/', catchAsync(getAllPaymentMethods));
router.get('/:id', catchAsync(getPaymentMethodById));


export default router;