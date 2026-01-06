import { Router } from "express";
import { createPromoCode, getAllPromoCodes, getPromocodeById, updatePromoCodeById, deletePromoCodeById } from "../../controllers/superadmin/promocodes";
import { validate } from "../../middlewares/validation";
import { createPromoCodeSchema, updatePromoCodeSchema ,} from "../../validators/superadmin/promocodes";
const router = Router();


router.post("/", validate(createPromoCodeSchema),createPromoCode);
router.get("/", getAllPromoCodes);
router.get("/:Id", getPromocodeById);
router.delete("/:Id", deletePromoCodeById);
router.put("/:Id", validate(updatePromoCodeSchema), updatePromoCodeById);

export default router;