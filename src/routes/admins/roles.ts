import { Router } from "express";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,   
    deleteRole,
    getAvailablePermissions,
    getAdminPermissions
} from "../../controllers/admin/roles";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createRoleSchema, updateRoleSchema } from "../../validators/admin/roles";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();

// ✅ Super Admin Role Routes
router.get("/permissions", catchAsync(getAvailablePermissions));
// ✅ Get All Roles
router.get("/",checkPermission("roles","View"), catchAsync(getAllRoles));
// ✅ Get Role By ID
router.get("/:id",checkPermission("roles","View"), catchAsync(getRoleById));
// ✅ Create Role
router.post("/",checkPermission("roles","Add"), validate(createRoleSchema), catchAsync(createRole));   
// ✅ Update Role
router.put("/:id",checkPermission("roles","Edit"), validate(updateRoleSchema), catchAsync(updateRole));
// ✅ Delete Role
router.delete("/:id",checkPermission("roles","Delete"), catchAsync(deleteRole));

export default router;