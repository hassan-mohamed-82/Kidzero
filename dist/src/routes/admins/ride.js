"use strict";
// src/routes/admin/rideRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ride_1 = require("../../controllers/admin/ride");
const validation_1 = require("../../middlewares/validation");
const ride_2 = require("../../validators/admin/ride");
const catchAsync_1 = require("../../utils/catchAsync");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
// ✅ Static Routes (يجب أن تكون قبل المسارات الديناميكية)
router.get("/dashboard", (0, checkpermission_1.checkPermission)("rides", "View"), (0, catchAsync_1.catchAsync)(ride_1.getRidesDashboard));
router.get("/current", (0, checkpermission_1.checkPermission)("rides", "View"), (0, catchAsync_1.catchAsync)(ride_1.getCurrentRides));
router.get("/upcoming", (0, checkpermission_1.checkPermission)("rides", "View"), (0, catchAsync_1.catchAsync)(ride_1.getUpcomingRides));
router.get("/selection", (0, checkpermission_1.checkPermission)("rides", "View"), (0, catchAsync_1.catchAsync)(ride_1.selection));
router.get("/students/search", (0, checkpermission_1.checkPermission)("rides", "View"), (0, catchAsync_1.catchAsync)(ride_1.searchStudentsForRide));
router.post("/by-date", (0, checkpermission_1.checkPermission)("rides", "View"), (0, validation_1.validate)(ride_2.getRidesByDateSchema), (0, catchAsync_1.catchAsync)(ride_1.getRidesByDate));
// ✅ Occurrence Routes (قبل الـ Dynamic Routes)
router.get("/occurrences/:occurrenceId", (0, checkpermission_1.checkPermission)("rides", "View"), (0, catchAsync_1.catchAsync)(ride_1.getOccurrenceDetails));
router.put("/occurrences/:occurrenceId/status", (0, checkpermission_1.checkPermission)("rides", "Edit"), (0, catchAsync_1.catchAsync)(ride_1.updateOccurrenceStatus));
// ✅ CRUD Routes
router.get("/", (0, checkpermission_1.checkPermission)("rides", "View"), (0, catchAsync_1.catchAsync)(ride_1.getAllRides));
router.post("/", (0, checkpermission_1.checkPermission)("rides", "Add"), (0, validation_1.validate)(ride_2.createRideSchema), (0, catchAsync_1.catchAsync)(ride_1.createRide));
// ✅ Dynamic Routes (المسارات التي تحتوي على :id)
router.get("/:id", (0, checkpermission_1.checkPermission)("rides", "View"), (0, validation_1.validate)(ride_2.rideIdSchema), (0, catchAsync_1.catchAsync)(ride_1.getRideById));
router.put("/:id", (0, checkpermission_1.checkPermission)("rides", "Edit"), (0, validation_1.validate)(ride_2.updateRideSchema), (0, catchAsync_1.catchAsync)(ride_1.updateRide));
router.delete("/:id", (0, checkpermission_1.checkPermission)("rides", "Delete"), (0, validation_1.validate)(ride_2.rideIdSchema), (0, catchAsync_1.catchAsync)(ride_1.deleteRide));
exports.default = router;
