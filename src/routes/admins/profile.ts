import {Router} from "express";
import {getProfile, updateProfile,
    deleteProfile
} from "../../controllers/admin/profile";
import {catchAsync} from "../../utils/catchAsync";
import {validate} from "../../middlewares/validation";

const router = Router();
router.get("/", catchAsync(getProfile));
router.put("/", validate, catchAsync(updateProfile));
router.delete("/", catchAsync(deleteProfile));
export default router;

