import { Router } from "express";
import { getAllSubscribers } from "../../controllers/superadmin/subscription";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router.get("/subscribers", catchAsync(getAllSubscribers));

export default router;