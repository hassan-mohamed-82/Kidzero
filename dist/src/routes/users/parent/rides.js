"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rides_1 = require("../../../controllers/users/parent/rides");
const authorized_1 = require("../../../middlewares/authorized");
const router = (0, express_1.Router)();
// Routes for Parent to manage rides
router.get("/today", (0, authorized_1.authorizeRoles)("parent"), rides_1.getTodayRides);
router.get("/history", (0, authorized_1.authorizeRoles)("parent"), rides_1.getRidesHistory);
router.get("/:rideId", (0, authorized_1.authorizeRoles)("parent"), rides_1.getRideDetails);
router.get("/:rideId/track", (0, authorized_1.authorizeRoles)("parent"), rides_1.trackRide);
router.get("/:childId/attendance", (0, authorized_1.authorizeRoles)("parent"), rides_1.getChildAttendance);
router.post("/:childId/report-absence", (0, authorized_1.authorizeRoles)("parent"), rides_1.reportAbsence);
exports.default = router;
