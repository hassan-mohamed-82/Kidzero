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

const router = Router();
router.get("/", catchAsync(getAllPickupPoints));
router.get("/:id", catchAsync(getPickupPointById));
router.post("/", validate(createPickupPointSchema), catchAsync(createPickupPoint));
router.put("/:id", validate(updatePickupPointSchema), catchAsync(updatePickupPoint));
router.delete("/:id", catchAsync(deletePickupPoint));

export default router;