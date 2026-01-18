import { Router } from "express";
import { createOrganizationService, deleteOrganizationService, getOrganizationServicebyId, getOrganizationServices, updateOrganizationService } from "../../controllers/admin/organizationServices";
import { catchAsync } from "../../utils/catchAsync";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();

router.get("/",checkPermission("organizationServices","View"), catchAsync(getOrganizationServices));
router.post("/",checkPermission("organizationServices","Add"), catchAsync(createOrganizationService));
router.get("/:id",checkPermission("organizationServices","View"), catchAsync(getOrganizationServicebyId));
router.put("/:id",checkPermission("organizationServices","Edit"), catchAsync(updateOrganizationService));
router.delete("/:id",checkPermission("organizationServices","Delete"), catchAsync(deleteOrganizationService));



export default router;