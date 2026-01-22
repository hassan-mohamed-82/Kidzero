import { Router } from 'express';
import { getPaymentById, getAllPayments, createPayment, requestRenewal, payPlanPrice ,getAllParentPayments} from '../../controllers/admin/payment';
import { catchAsync } from '../../utils/catchAsync';
import { checkPermission } from '../../middlewares/checkpermission';
const router = Router();

router.get('/',checkPermission("payments","View"), catchAsync(getAllPayments));
router.get('/:id',checkPermission("payments","View"), catchAsync(getPaymentById));
router.post('/',checkPermission("payments","Add"), catchAsync(createPayment));
router.post('/renewal',checkPermission("payments","Add"), catchAsync(requestRenewal));
router.post('/plan-price',checkPermission("payments","Add"), catchAsync(payPlanPrice));
router.get('/parent-payments',checkPermission("payments","View"), catchAsync(getAllParentPayments));
export default router;
