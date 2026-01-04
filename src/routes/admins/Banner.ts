import { Router } from "express";
import {
    createBanner,
    getAllBanners,
    getBanner,
    updateBanner,
    deleteBanner,
} from "../../controllers/admin/Banner";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router
    .route("/")
    .get(catchAsync(getAllBanners))
    .post(catchAsync(createBanner));

router
    .route("/:id")
    .get(catchAsync(getBanner))
    .put(catchAsync(updateBanner))
    .delete(catchAsync(deleteBanner));

export default router;