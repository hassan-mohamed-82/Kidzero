import { Router } from "express";
import { getAllOrganizationTypes, getOrganizationTypeById, createOrganizationType, updateOrganizationType, deleteOrganizationType } from "../../controllers/superadmin/organization";
const router = Router();
// Organization Types Routes
router.get("/types", getAllOrganizationTypes);
router.post("/types", createOrganizationType);
router.get("/types/:id", getOrganizationTypeById);
router.put("/types/:id", updateOrganizationType);
router.delete("/types/:id", deleteOrganizationType);
export default router;
//# sourceMappingURL=organization.js.map