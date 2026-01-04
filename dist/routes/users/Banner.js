import { Router } from "express";
import { getAllBanners, getBanner } from "../../controllers/users/Banner";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();
router
    .route("/")
    .get(catchAsync(getAllBanners));
router
    .route("/:id")
    .get(catchAsync(getBanner));
export default router;
//# sourceMappingURL=Banner.js.map