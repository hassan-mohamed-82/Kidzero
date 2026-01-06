import { Router } from "express";
import { createBus, deleteBus, getAllBuses, getBusById, updateBus, updateBusStatus, getBusesByStatus } from "../../controllers/admin/bus";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createBusSchema, updateBusSchema } from "../../validators/admin/bus";
const router = Router();
// ✅ الـ Static Routes الأول (اللي فيها كلمات ثابتة)
router.get("/status/:status", catchAsync(getBusesByStatus));
// ✅ الـ CRUD العادي
router.get("/", catchAsync(getAllBuses));
router.post("/", validate(createBusSchema), catchAsync(createBus));
// ✅ الـ Dynamic Routes في الآخر (اللي فيها :id)
router.get("/:id", catchAsync(getBusById));
router.put("/:id", validate(updateBusSchema), catchAsync(updateBus));
router.put("/:id/status", catchAsync(updateBusStatus)); // ✅ غيّر لـ PATCH و /:id/status
router.delete("/:id", catchAsync(deleteBus));
export default router;
//# sourceMappingURL=bus.js.map