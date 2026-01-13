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

const router = Router();

// ✅ Super Admin Role Routes
router.get("/permissions", catchAsync(getAvailablePermissions));
// ✅ Get All Roles
router.get("/", catchAsync(getAllRoles));
// ✅ Get Role By ID
router.get("/:id", catchAsync(getRoleById));
// ✅ Create Role
router.post("/", validate(createRoleSchema), catchAsync(createRole));   
// ✅ Update Role
router.put("/:id", validate(updateRoleSchema), catchAsync(updateRole));
// ✅ Delete Role
router.delete("/:id", catchAsync(deleteRole));

export default router;