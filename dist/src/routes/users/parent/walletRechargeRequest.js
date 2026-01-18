"use strict";
// src/routes/users/parent/wallet.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorized_1 = require("../../../middlewares/authorized");
const catchAsync_1 = require("../../../utils/catchAsync");
const walletRechargeRequest_1 = require("../../../controllers/users/parent/walletRechargeRequest");
const router = (0, express_1.Router)();
router.use((0, authorized_1.authorizeRoles)("parent"));
// طرق الدفع
router.get("/selection", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.getWalletSelection));
router.get("/recharge/:childId", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.getChildWallet));
// طلب شحن
router.post("/recharge", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.requestRecharge));
// طلباتي
router.get("/requests", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.getMyRechargeRequests));
// محفظة طفل
router.get("/child/:childId", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.getChildWallet));
exports.default = router;
