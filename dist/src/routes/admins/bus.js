"use strict";
// src/routes/admin/busRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bus_1 = require("../../controllers/admin/bus");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const bus_2 = require("../../validators/admin/bus");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
// ✅ Static Routes أولاً
router.get("/types", (0, checkpermission_1.checkPermission)("buses", "View"), (0, catchAsync_1.catchAsync)(bus_1.getBusTypes));
router.get("/status/:status", (0, checkpermission_1.checkPermission)("buses", "View"), (0, catchAsync_1.catchAsync)(bus_1.getBusesByStatus));
router.get("/details/:id", (0, checkpermission_1.checkPermission)("buses", "View"), (0, catchAsync_1.catchAsync)(bus_1.getBusDetails));
// ✅ CRUD Routes
router.get("/", (0, checkpermission_1.checkPermission)("buses", "View"), (0, catchAsync_1.catchAsync)(bus_1.getAllBuses));
router.post("/", (0, checkpermission_1.checkPermission)("buses", "Add"), (0, validation_1.validate)(bus_2.createBusSchema), (0, catchAsync_1.catchAsync)(bus_1.createBus));
// ✅ Dynamic Routes آخراً
router.get("/:id", (0, checkpermission_1.checkPermission)("buses", "View"), (0, catchAsync_1.catchAsync)(bus_1.getBusById));
router.put("/:id", (0, checkpermission_1.checkPermission)("buses", "Edit"), (0, validation_1.validate)(bus_2.updateBusSchema), (0, catchAsync_1.catchAsync)(bus_1.updateBus));
router.patch("/:id/status", (0, checkpermission_1.checkPermission)("buses", "Edit"), (0, catchAsync_1.catchAsync)(bus_1.updateBusStatus));
router.delete("/:id", (0, checkpermission_1.checkPermission)("buses", "Delete"), (0, catchAsync_1.catchAsync)(bus_1.deleteBus));
exports.default = router;
