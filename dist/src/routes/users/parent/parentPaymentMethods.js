"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentMethod_1 = require("../../../controllers/superadmin/paymentMethod");
const catchAsync_1 = require("../../../utils/catchAsync");
const router = (0, express_1.Router)();
router.get('/', (0, catchAsync_1.catchAsync)(paymentMethod_1.getAllPaymentMethods));
router.get('/:id', (0, catchAsync_1.catchAsync)(paymentMethod_1.getPaymentMethodById));
exports.default = router;
