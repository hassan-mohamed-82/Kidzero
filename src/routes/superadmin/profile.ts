import { Router } from "express";
import { getProfile , updateProfile , changePassword } from "../../controllers/Superadmin/profile";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router.get("/", catchAsync(getProfile));
router.put("/", catchAsync(updateProfile));
router.put("/change-password", catchAsync(changePassword));

export default router;