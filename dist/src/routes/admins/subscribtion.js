"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscribtion_1 = require("../../controllers/admin/subscribtion");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
// ✅ GET Routes
router.get("/", (0, catchAsync_1.catchAsync)(subscribtion_1.getMySubscriptions));
router.get("/plans", (0, catchAsync_1.catchAsync)(subscribtion_1.getAvailablePlans));
router.get("/payment-methods", (0, catchAsync_1.catchAsync)(subscribtion_1.getPaymentMethods));
router.get("/:id", (0, catchAsync_1.catchAsync)(subscribtion_1.getSubscriptionById));
// ✅ POST Routes
router.post("/subscribe", (0, catchAsync_1.catchAsync)(subscribtion_1.subscribe));
router.post("/renew", (0, catchAsync_1.catchAsync)(subscribtion_1.renewSubscription));
router.post("/upgrade", (0, catchAsync_1.catchAsync)(subscribtion_1.upgradeSubscription));
exports.default = router;
