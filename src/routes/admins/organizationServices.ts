import { Router } from "express";
import { createOrganizationService, deleteOrganizationService, getOrganizationServicebyId, getOrganizationServices, updateOrganizationService } from "../../controllers/admin/organizationServices";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router.get("/", catchAsync(getOrganizationServices));
router.post("/", catchAsync(createOrganizationService));
router.get("/:id", catchAsync(getOrganizationServicebyId));
router.put("/:id", catchAsync(updateOrganizationService));
router.delete("/:id", catchAsync(deleteOrganizationService));



export default router;