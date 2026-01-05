import { Router } from "express";
import { createPromoCode, getAllPromoCodes, getPromocodeById, updatePromoCodeById, deletePromoCodeById } from "../../controllers/superadmin/promocodes";
const router = Router();
router.post("/", createPromoCode);
router.get("/", getAllPromoCodes);
router.get("/:Id", getPromocodeById);
router.delete("/:Id", deletePromoCodeById);
router.put("/:Id", updatePromoCodeById);
export default router;
//# sourceMappingURL=promocodes.js.map