import { Router } from "express";
import {
    getAllAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    getRoleNames

} from "../../controllers/admin/admin";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createAdminSchema,updateAdminSchema } from "../../validators/admin/admin";
const router = Router();
router.get("/roles", catchAsync(getRoleNames));
router.get("/", catchAsync(getAllAdmins));
router.get("/:id", catchAsync(getAdminById));
router.post("/", validate(createAdminSchema), catchAsync(createAdmin));
router.put("/:id", validate(updateAdminSchema), catchAsync(updateAdmin));
router.delete("/:id", catchAsync(deleteAdmin));
export default router;