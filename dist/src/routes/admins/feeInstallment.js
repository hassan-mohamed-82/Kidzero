"use strict";
// src/routes/admins/feeInstallment.ts
// Routes for organization admin to manage subscription fee installments
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feeInstallment_1 = require("../../controllers/admin/feeInstallment");
const catchAsync_1 = require("../../utils/catchAsync");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
// Get current installment status and summary
router.get('/status', (0, checkpermission_1.checkPermission)("feeinstallments", "View"), (0, catchAsync_1.catchAsync)(feeInstallment_1.getInstallmentStatus));
// Get all installment history
router.get('/history', (0, checkpermission_1.checkPermission)("feeinstallments", "View"), (0, catchAsync_1.catchAsync)(feeInstallment_1.getInstallmentHistory));
// Get specific installment by ID
router.get('/:id', (0, checkpermission_1.checkPermission)("feeinstallments", "View"), (0, catchAsync_1.catchAsync)(feeInstallment_1.getInstallmentById));
// Create new installment payment
router.post('/', (0, checkpermission_1.checkPermission)("feeinstallments", "Add"), (0, catchAsync_1.catchAsync)(feeInstallment_1.createInstallmentPayment));
exports.default = router;
