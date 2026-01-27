import { Router } from "express";
import { getProfile, updateProfile, changePassword } from "../../controllers/superadmin/profile";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { updateProfileSchema, changePasswordSchema } from "../../validators/superadmin/profile";
const router = Router();

router.get("/", catchAsync(getProfile));
router.put("/", validate(updateProfileSchema), catchAsync(updateProfile));
router.put("/change-password", validate(changePasswordSchema), catchAsync(changePassword));

export default router;