"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_1 = require("../../controllers/admin/driver");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const driver_2 = require("../../validators/admin/driver");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
// ✅ Get All Drivers
router.get("/", (0, checkpermission_1.checkPermission)("drivers", "View"), (0, catchAsync_1.catchAsync)(driver_1.getAllDrivers));
// ✅ Get Driver By ID
router.get("/:id", (0, checkpermission_1.checkPermission)("drivers", "View"), (0, catchAsync_1.catchAsync)(driver_1.getDriverById));
// ✅ Create Driver
router.post("/", (0, checkpermission_1.checkPermission)("drivers", "Add"), (0, validation_1.validate)(driver_2.createDriverSchema), (0, catchAsync_1.catchAsync)(driver_1.createDriver));
// ✅ Update Driver
router.put("/:id", (0, checkpermission_1.checkPermission)("drivers", "Edit"), (0, validation_1.validate)(driver_2.updateDriverSchema), (0, catchAsync_1.catchAsync)(driver_1.updateDriver));
// ✅ Delete Driver
router.delete("/:id", (0, checkpermission_1.checkPermission)("drivers", "Delete"), (0, catchAsync_1.catchAsync)(driver_1.deleteDriver));
exports.default = router;
