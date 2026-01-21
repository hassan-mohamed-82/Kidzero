// src/routes/admin/busRoutes.ts

import { Router } from "express";
import {
  createBus,
  deleteBus,
  getAllBuses,
  getBusById,
  updateBus,
  updateBusStatus,
  getBusesByStatus,
  getBusDetails,
  getBusTypes
} from "../../controllers/admin/bus";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createBusSchema, updateBusSchema } from "../../validators/admin/bus";
import { checkPermission } from "../../middlewares/checkpermission";

const router = Router();

// ✅ Static Routes أولاً
router.get("/types", checkPermission("buses", "View"), catchAsync(getBusTypes));
router.get("/status/:status", checkPermission("buses", "View"), catchAsync(getBusesByStatus));
router.get("/details/:id", checkPermission("buses", "View"), catchAsync(getBusDetails));

// ✅ CRUD Routes
router.get("/", checkPermission("buses", "View"), catchAsync(getAllBuses));
router.post("/", checkPermission("buses", "Add"), validate(createBusSchema), catchAsync(createBus));

// ✅ Dynamic Routes آخراً
router.get("/:id", checkPermission("buses", "View"), catchAsync(getBusById));
router.put("/:id", checkPermission("buses", "Edit"), validate(updateBusSchema), catchAsync(updateBus));
router.patch("/:id/status", checkPermission("buses", "Edit"), catchAsync(updateBusStatus));
router.delete("/:id", checkPermission("buses", "Delete"), catchAsync(deleteBus));

export default router;