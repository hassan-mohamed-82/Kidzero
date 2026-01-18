import { Router } from "express";
import {
    createBus,
    deleteBus,
    getAllBuses,
    getBusById,
    updateBus,
    updateBusStatus,
    getBusesByStatus,
    getBusTypes
    
} from "../../controllers/admin/bus";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createBusSchema, updateBusSchema } from "../../validators/admin/bus";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();

// ✅ الـ Static Routes الأول (اللي فيها كلمات ثابتة)
router.get("/status/:status", checkPermission("buses","View"), catchAsync(getBusesByStatus));

// ✅ الـ CRUD العادي
router.get("/",checkPermission("buses","View"), catchAsync(getAllBuses));
router.post("/",checkPermission("buses","Add"), validate(createBusSchema), catchAsync(createBus));
router.get("/types",checkPermission("buses","View"), catchAsync(getBusTypes));

// ✅ الـ Dynamic Routes في الآخر (اللي فيها :id)
router.get("/:id",checkPermission("buses","View"), catchAsync(getBusById));
router.put("/:id",checkPermission("buses","Edit"), validate(updateBusSchema), catchAsync(updateBus));
router.put("/:id/status",checkPermission("buses","Edit"), catchAsync(updateBusStatus));  // ✅ غيّر لـ PATCH و /:id/status
router.delete("/:id",checkPermission("buses","Delete"), catchAsync(deleteBus));

export default router;
