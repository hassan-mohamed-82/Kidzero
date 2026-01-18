"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../controllers/users/auth");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const auth_2 = require("../../validators/users/auth");
const router = (0, express_1.Router)();
// ✅ Mobile User Auth Routes
router.post("/login", (0, validation_1.validate)(auth_2.mobileLoginSchema), (0, catchAsync_1.catchAsync)(auth_1.driverAppLogin));
router.post("/parent/login", (0, validation_1.validate)(auth_2.mobileLoginSchema), (0, catchAsync_1.catchAsync)(auth_1.parentLogin));
router.post("/forgot-password", (0, catchAsync_1.catchAsync)(auth_1.forgotPassword));
router.post("/verify-email", (0, catchAsync_1.catchAsync)(auth_1.verifyEmail));
router.post("/verify-reset-code", (0, catchAsync_1.catchAsync)(auth_1.verifyResetCode));
router.post("/reset-password", (0, catchAsync_1.catchAsync)(auth_1.resetPassword));
router.post("/fcm-token", (0, catchAsync_1.catchAsync)(auth_1.updateFcmToken));
// router.post("/verification-code", catchAsync(resendVerificationCode));
router.post("/signup", (0, catchAsync_1.catchAsync)(auth_1.signup));
exports.default = router;
