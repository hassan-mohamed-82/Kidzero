"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/users/parent/rides.ts
const express_1 = require("express");
const authorized_1 = require("../../../middlewares/authorized");
const catchAsync_1 = require("../../../utils/catchAsync");
const rides_1 = require("../../../controllers/users/parent/rides");
const router = (0, express_1.Router)();
// ✅ رحلات أولادي
router.get("/children", (0, authorized_1.authorizeRoles)("parent"), (0, catchAsync_1.catchAsync)(rides_1.getMyChildrenRides));
// ✅ رحلات الطفل
router.get("/child/:childId", (0, authorized_1.authorizeRoles)("parent"), (0, catchAsync_1.catchAsync)(rides_1.getChildRides));
// ✅ تتبع الرحلة لحظياً
router.get("/tracking/:occurrenceId", (0, authorized_1.authorizeRoles)("parent"), (0, catchAsync_1.catchAsync)(rides_1.getLiveTracking));
// ✅ تقديم عذر غياب
router.post("/excuse/:occurrenceId/:studentId", (0, authorized_1.authorizeRoles)("parent"), (0, catchAsync_1.catchAsync)(rides_1.submitExcuse));
exports.default = router;
