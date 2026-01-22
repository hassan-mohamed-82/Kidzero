import { Router } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import { getAllAvailableOrganizationServices } from "../../../controllers/users/parent/organizationServices";
const router = Router();

router.get("/:studentId", catchAsync(getAllAvailableOrganizationServices));

export default router;