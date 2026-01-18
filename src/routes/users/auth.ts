import { Router } from "express";
import {
    parentLogin,driverAppLogin,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    updateFcmToken,
    // resendVerificationCode,
    signup,
    verifyEmail,
}from "../../controllers/users/auth"
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import {
    mobileLoginSchema,
    changePasswordSchema,
    updateProfileSchema
} from "../../validators/users/auth";
const router = Router();

// ✅ Mobile User Auth Routes
router.post("/login", validate(mobileLoginSchema), catchAsync(driverAppLogin));
router.post("/parent/login", validate(mobileLoginSchema), catchAsync(parentLogin));
router.post("/forgot-password", catchAsync(forgotPassword));
router.post("/verify-email", catchAsync(verifyEmail));
router.post("/verify-reset-code", catchAsync(verifyResetCode));
router.post("/reset-password", catchAsync(resetPassword));
router.post("/fcm-token", catchAsync(updateFcmToken));
// router.post("/verification-code", catchAsync(resendVerificationCode));
router.post("/signup", catchAsync(signup));

export default router;
