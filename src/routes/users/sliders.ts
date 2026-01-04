import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { getActiveSliders } from "../../controllers/users/sliders";
const router = Router();
router.get("/", catchAsync(getActiveSliders));
export default router;
