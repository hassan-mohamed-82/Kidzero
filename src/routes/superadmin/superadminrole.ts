import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import{
    getAllRoles,
    getRoleById,getAvailablePermissions,
    createRole,updateRole,deleteRole
 } from "../../controllers/superadmin/superadminroles";

const router = Router();

// ✅ Super Admin Role Routes
router.get("/", catchAsync(getAllRoles));
router.get("/permissions", catchAsync(getAvailablePermissions));
router.get("/:id", catchAsync(getRoleById));
router.post("/", catchAsync(createRole));
router.put("/:id", catchAsync(updateRole));
router.delete("/:id", catchAsync(deleteRole));

export default router;