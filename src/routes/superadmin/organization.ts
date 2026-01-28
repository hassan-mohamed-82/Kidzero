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
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createOrganizationSchema, updateOrganizationSchema } from "../../validators/superadmin/organization";
import { createOrganizationTypeSchema, updateOrganizationTypeSchema } from "../../validators/superadmin/organizationTypes";

const router = Router();

// Organization Types Routes
router.get("/types", catchAsync(getAllOrganizationTypes));
router.post("/types", validate(createOrganizationTypeSchema), catchAsync(createOrganizationType));
router.get("/types/:id", catchAsync(getOrganizationTypeById));
router.put("/types/:id", validate(updateOrganizationTypeSchema), catchAsync(updateOrganizationType));
router.delete("/types/:id", catchAsync(deleteOrganizationType));

// Organizations Routes
router.get("/", catchAsync(getAllOrganizations));
router.post("/", validate(createOrganizationSchema), catchAsync(createOrganization));
router.get("/:id", catchAsync(getOrganizationById));
router.put("/:id", validate(updateOrganizationSchema), catchAsync(updateOrganization));
router.delete("/:id", catchAsync(deleteOrganization));



export default router;