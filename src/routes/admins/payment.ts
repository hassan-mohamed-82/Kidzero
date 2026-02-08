import { Router } from 'express';
import { getPaymentById, getAllPayments, createPayment, requestRenewal, payPlanPrice, getAllParentPayments, ReplyToParentPayment, ReplyToParentPaymentInstallment } from '../../controllers/admin/payment';
import { catchAsync } from '../../utils/catchAsync';
import { checkPermission } from '../../middlewares/checkpermission';
const router = Router();

router.get('/', checkPermission("payments", "View"), catchAsync(getAllPayments));
router.post('/', checkPermission("payments", "Add"), catchAsync(createPayment));
router.post('/renewal', checkPermission("payments", "Add"), catchAsync(requestRenewal));
router.post('/plan-price', checkPermission("payments", "Add"), catchAsync(payPlanPrice));
router.get('/parent-payments', checkPermission("payments", "View"), catchAsync(getAllParentPayments));
router.post('/replyParentPayment/:id', checkPermission("payments", "Add"), catchAsync(ReplyToParentPayment));
router.post('/replyParentPaymentInstallment/:id', checkPermission("payments", "Add"), catchAsync(ReplyToParentPaymentInstallment));
router.get('/:id', checkPermission("payments", "View"), catchAsync(getPaymentById));
export default router;
