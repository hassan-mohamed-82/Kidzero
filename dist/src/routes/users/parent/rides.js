"use strict";
// src/routes/users/parent/rides.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorized_1 = require("../../../middlewares/authorized");
const catchAsync_1 = require("../../../utils/catchAsync");
const rides_1 = require("../../../controllers/users/parent/rides");
const router = (0, express_1.Router)();
// ✅ All routes require parent role
router.use((0, authorized_1.authorizeRoles)("parent"));
// ============ Static Routes First ============
// ✅ رحلات اليوم لكل الأولاد
router.get("/today", (0, catchAsync_1.catchAsync)(rides_1.getTodayRidesForAllChildren));
// ✅ كل أولادي مع رحلاتهم
router.get("/children", (0, catchAsync_1.catchAsync)(rides_1.getMyChildrenRides));
// ============ Child Specific Routes ============
// ✅ رحلات طفل معين (today/upcoming/history)
// GET /rides/child/:childId?type=today
// GET /rides/child/:childId?type=upcoming
// GET /rides/child/:childId?type=history&from=2026-01-01&to=2026-01-18
router.get("/child/:childId", (0, catchAsync_1.catchAsync)(rides_1.getChildRides));
// ✅ ملخص سجل الرحلات لطفل معين
// GET /rides/child/:childId/summary?month=1&year=2026
router.get("/child/:childId/summary", (0, catchAsync_1.catchAsync)(rides_1.getRideHistorySummary));
// ============ Occurrence Routes ============
// ✅ تتبع الرحلة لحظياً
router.get("/tracking/:occurrenceId", (0, catchAsync_1.catchAsync)(rides_1.getLiveTracking));
// ✅ تقديم عذر غياب
router.post("/excuse/:occurrenceId/:studentId", (0, catchAsync_1.catchAsync)(rides_1.submitExcuse));
exports.default = router;
