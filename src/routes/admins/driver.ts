// src/routes/admin/driverRoutes.ts

import { Router } from "express";
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverDetails
} from "../../controllers/admin/driver";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createDriverSchema, updateDriverSchema } from "../../validators/admin/driver";
import { checkPermission } from "../../middlewares/checkpermission";

const router = Router();

// ✅ Static Routes أولاً
router.get("/details/:id", checkPermission("drivers", "View"), catchAsync(getDriverDetails));

// ✅ CRUD Routes
router.get("/", checkPermission("drivers", "View"), catchAsync(getAllDrivers));
router.post("/", checkPermission("drivers", "Add"), validate(createDriverSchema), catchAsync(createDriver));

// ✅ Dynamic Routes آخراً
router.get("/:id", checkPermission("drivers", "View"), catchAsync(getDriverById));
router.put("/:id", checkPermission("drivers", "Edit"), validate(updateDriverSchema), catchAsync(updateDriver));
router.delete("/:id", checkPermission("drivers", "Delete"), catchAsync(deleteDriver));

export default router;