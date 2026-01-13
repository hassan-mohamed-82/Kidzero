"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_1 = require("../../controllers/superadmin/payment");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
// Payment routes
router.get('/', (0, catchAsync_1.catchAsync)(payment_1.getAllPayments));
router.get('/:id', (0, catchAsync_1.catchAsync)(payment_1.getPaymentById));
router.put('/:id/reply', (0, catchAsync_1.catchAsync)(payment_1.ReplyToPayment));
// Installment routes
router.get('/installments/all', (0, catchAsync_1.catchAsync)(payment_1.getAllInstallments));
router.get('/installments/:id', (0, catchAsync_1.catchAsync)(payment_1.getInstallmentById));
router.put('/installments/:id/approve', (0, catchAsync_1.catchAsync)(payment_1.approveInstallment));
router.put('/installments/:id/reject', (0, catchAsync_1.catchAsync)(payment_1.rejectInstallment));
exports.default = router;
