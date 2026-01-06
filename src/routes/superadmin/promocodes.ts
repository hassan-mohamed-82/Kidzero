import { Router } from "express";
import { createPromoCode, getAllPromoCodes, getPromocodeById, updatePromoCodeById, deletePromoCodeById } from "../../controllers/superadmin/promocodes";
import { validate } from "../../middlewares/validation";
import { createPromoCodeSchema, updatePromoCodeSchema ,} from "../../validators/superadmin/promocodes";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();


router.post("/", validate(createPromoCodeSchema), catchAsync(createPromoCode));
router.get("/", catchAsync(getAllPromoCodes));
router.get("/:Id", catchAsync(getPromocodeById));
router.delete("/:Id", catchAsync(deletePromoCodeById));
router.put("/:Id", validate(updatePromoCodeSchema), catchAsync(updatePromoCodeById));

export default router;