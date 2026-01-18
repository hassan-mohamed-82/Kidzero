// src/routes/admins/feeInstallment.ts
// Routes for organization admin to manage subscription fee installments

import { Router } from 'express';
import {
    getInstallmentStatus,
    getInstallmentHistory,
    createInstallmentPayment,
    getInstallmentById
} from '../../controllers/admin/feeInstallment';
import { catchAsync } from '../../utils/catchAsync';
import { checkPermission } from '../../middlewares/checkpermission';
const router = Router();

// Get current installment status and summary
router.get('/status',checkPermission("feeinstallments","View"), catchAsync(getInstallmentStatus));

// Get all installment history
router.get('/history',checkPermission("feeinstallments","View"), catchAsync(getInstallmentHistory));

// Get specific installment by ID
router.get('/:id',checkPermission("feeinstallments","View"), catchAsync(getInstallmentById));

// Create new installment payment
router.post('/',checkPermission("feeinstallments","Add"), catchAsync(createInstallmentPayment));

export default router;
