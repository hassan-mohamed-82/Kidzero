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
import { checkPermission } from "../../middlewares/checkpermission";
import { createAdminSchema,updateAdminSchema } from "../../validators/admin/admin";
const router = Router();
router.get("/roles",checkPermission("admins","View"), catchAsync(getRoleNames));
router.get("/",checkPermission("admins","View"), catchAsync(getAllAdmins));
router.get("/:id",checkPermission("admins","View"), catchAsync(getAdminById));
router.post("/",checkPermission("admins","Add"), validate(createAdminSchema), catchAsync(createAdmin));
router.put("/:id",checkPermission("admins","Edit"), validate(updateAdminSchema), catchAsync(updateAdmin));
router.delete("/:id",checkPermission("admins","Delete"), catchAsync(deleteAdmin));
export default router;