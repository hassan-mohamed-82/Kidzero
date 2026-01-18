import { Router } from "express";
import {
    getAllPickupPoints,
    getPickupPointById,
    createPickupPoint,
    updatePickupPoint,
    deletePickupPoint,
} from "../../controllers/admin/pickuppoint";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import {
    createPickupPointSchema,
    updatePickupPointSchema,
} from "../../validators/admin/pickuppoint";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();
router.get("/",checkPermission("pickup_points","View"), catchAsync(getAllPickupPoints));
router.get("/:id",checkPermission("pickup_points","View"), catchAsync(getPickupPointById));
router.post("/",checkPermission("pickup_points","Add"), validate(createPickupPointSchema), catchAsync(createPickupPoint));
router.put("/:id",checkPermission("pickup_points","Edit"), validate(updatePickupPointSchema), catchAsync(updatePickupPoint));
router.delete("/:id",checkPermission("pickup_points","Delete"), catchAsync(deletePickupPoint));

export default router;