"use strict";
// / src/routes/superAdmin/walletRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catchAsync_1 = require("../../utils/catchAsync");
const walletRechargeRequest_1 = require("../../controllers/superadmin/walletRechargeRequest");
const router = (0, express_1.Router)();
// ✅ إحصائيات
router.get("/stats", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.getWalletStats));
// ✅ طلبات الشحن
router.get("/", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.getAllRechargeRequests));
router.get("/:requestId", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.getRechargeRequestById));
router.post("/:requestId/approve", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.approveRechargeRequest));
router.post("/:requestId/reject", (0, catchAsync_1.catchAsync)(walletRechargeRequest_1.rejectRechargeRequest));
exports.default = router;
