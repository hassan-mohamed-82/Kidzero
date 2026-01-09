import { Router } from "express";
import {catchAsync} from "../../utils/catchAsync";
import {
    getAllSubAdmins,
    getSubAdminById,
    createSubAdmin,updateSubAdmin,deleteSubAdmin,

} from "../../controllers/superadmin/subadmins";

import { validate } from "../../middlewares/validation";
import {
    createSubAdminSchema,
    updateSubAdminSchema,
} from "../../validators/superadmin/subadmins";

const router = Router();

// ✅ SubAdmin Routes
router.get("/", catchAsync(getAllSubAdmins));
router.post("/", validate(createSubAdminSchema), catchAsync(createSubAdmin));
router.get("/:id", catchAsync(getSubAdminById));
router.put("/:id", validate(updateSubAdminSchema), catchAsync(updateSubAdmin));
router.delete("/:id", catchAsync(deleteSubAdmin));
export default router;