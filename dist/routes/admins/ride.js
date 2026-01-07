"use strict";
// src/routes/admin/rideRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ride_1 = require("../../controllers/admin/ride");
const validation_1 = require("../../middlewares/validation");
const ride_2 = require("../../validators/admin/ride");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
router.post("/", (0, validation_1.validate)(ride_2.createRideSchema), (0, catchAsync_1.catchAsync)(ride_1.createRide));
router.get("/", ride_1.getAllRides);
router.get("/:id", (0, validation_1.validate)(ride_2.rideIdSchema), (0, catchAsync_1.catchAsync)(ride_1.getRideById));
router.put("/:id", (0, validation_1.validate)(ride_2.updateRideSchema), (0, catchAsync_1.catchAsync)(ride_1.updateRide));
router.delete("/:id", (0, validation_1.validate)(ride_2.rideIdSchema), (0, catchAsync_1.catchAsync)(ride_1.deleteRide));
// Students in Ride
router.post("/:id/students", (0, validation_1.validate)(ride_2.addStudentsToRideSchema), (0, catchAsync_1.catchAsync)(ride_1.addStudentsToRide));
router.delete("/:id/students/:studentId", (0, validation_1.validate)(ride_2.removeStudentFromRideSchema), (0, catchAsync_1.catchAsync)(ride_1.removeStudentFromRide));
exports.default = router;
