import { Router } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import { getAllAvailableOrganizationServices } from "../../../controllers/users/parent/organizationServices";
import { getCurrentSubscribedServices } from "../../../controllers/users/parent/organizationServices";
const router = Router();

router.get("/:studentId", catchAsync(getAllAvailableOrganizationServices));
router.get("/current-subscribed/:studentId", catchAsync(getCurrentSubscribedServices));

export default router;