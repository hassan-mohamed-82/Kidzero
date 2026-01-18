"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zone_1 = require("../../controllers/admin/zone");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const zone_2 = require("../../validators/admin/zone");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
// ✅ Create Zone
router.post("/", (0, checkpermission_1.checkPermission)("Zone", "Add"), (0, validation_1.validate)(zone_2.createZoneSchema), (0, catchAsync_1.catchAsync)(zone_1.createZone));
// ✅ Get All Zones
router.get("/", (0, checkpermission_1.checkPermission)("Zone", "View"), (0, catchAsync_1.catchAsync)(zone_1.getZones));
// ✅ Get Zone By ID
router.get("/:id", (0, checkpermission_1.checkPermission)("Zone", "View"), (0, catchAsync_1.catchAsync)(zone_1.getZoneById));
// ✅ Update Zone
router.put("/:id", (0, checkpermission_1.checkPermission)("Zone", "Edit"), (0, validation_1.validate)(zone_2.updateZoneSchema), (0, catchAsync_1.catchAsync)(zone_1.updateZone));
// ✅ Delete Zone
router.delete("/:id", (0, checkpermission_1.checkPermission)("Zone", "Delete"), (0, catchAsync_1.catchAsync)(zone_1.deleteZone));
exports.default = router;
