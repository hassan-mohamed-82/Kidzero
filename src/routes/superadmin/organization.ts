import { Router } from "express";
import {
    getAllOrganizationTypes,
    getOrganizationTypeById,
    createOrganizationType,
    updateOrganizationType,
    deleteOrganizationType,

    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization
} from "../../controllers/superadmin/organization";
import {catchAsync} from "../../utils/catchAsync";
const router = Router();

// Organization Types Routes
router.get("/types", catchAsync(getAllOrganizationTypes));
router.post("/types", catchAsync(createOrganizationType));
router.get("/types/:id", catchAsync(getOrganizationTypeById));
router.put("/types/:id", catchAsync(updateOrganizationType));
router.delete("/types/:id", catchAsync(deleteOrganizationType));

// Organizations Routes
router.get("/", catchAsync(getAllOrganizations));
router.post("/", catchAsync(createOrganization));
router.get("/:id", catchAsync(getOrganizationById));
router.put("/:id", catchAsync(updateOrganization));
router.delete("/:id", catchAsync(deleteOrganization));



export default router;