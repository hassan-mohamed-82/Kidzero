import { Router } from "express";

import { getParentSubscriptions, getParentSubscriptionById } from "../../../controllers/users/parent/parentSubscribtion";
import {catchAsync} from "../../../utils/catchAsync";
const router = Router();

router.get("/", catchAsync(getParentSubscriptions));
router.get("/:id", catchAsync(getParentSubscriptionById));

export default router;