import { Router } from "express";
import { getActivePopUpsForPage } from "../../controllers/users/popUps";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();
router.route("/:pageName").get(catchAsync(getActivePopUpsForPage));
export default router;
