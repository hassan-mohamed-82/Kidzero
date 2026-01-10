import { Router } from "express";
import {
    changePassword,
    getMyProfile,
    updateProfile
}from "../../controllers/users/profile"
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import {
    mobileLoginSchema,
    changePasswordSchema,
    updateProfileSchema
} from "../../validators/users/auth";
const router = Router();

router.post("/change-password", validate(changePasswordSchema), catchAsync(changePassword));
router.get("/me", catchAsync(getMyProfile));
router.put("/me", validate(updateProfileSchema), catchAsync(updateProfile));
export default router;
