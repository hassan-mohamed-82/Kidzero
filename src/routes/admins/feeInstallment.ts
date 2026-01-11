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

const router = Router();

// Get current installment status and summary
router.get('/status', catchAsync(getInstallmentStatus));

// Get all installment history
router.get('/history', catchAsync(getInstallmentHistory));

// Get specific installment by ID
router.get('/:id', catchAsync(getInstallmentById));

// Create new installment payment
router.post('/', catchAsync(createInstallmentPayment));

export default router;
