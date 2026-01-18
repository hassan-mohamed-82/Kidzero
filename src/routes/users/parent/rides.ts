// src/routes/users/parent/rides.ts

import { Router } from "express";
import { authorizeRoles } from "../../../middlewares/authorized";
import { catchAsync } from "../../../utils/catchAsync";
import {
  getMyChildrenRides,
  getTodayRidesForAllChildren,
  getChildRides,
  getLiveTracking,
  submitExcuse,
  getRideHistorySummary,
} from "../../../controllers/users/parent/rides";

const router = Router();

// ✅ All routes require parent role
router.use(authorizeRoles("parent"));

// ============ Static Routes First ============

// ✅ رحلات اليوم لكل الأولاد
router.get("/today", catchAsync(getTodayRidesForAllChildren));

// ✅ كل أولادي مع رحلاتهم
router.get("/children", catchAsync(getMyChildrenRides));

// ============ Child Specific Routes ============

// ✅ رحلات طفل معين (today/upcoming/history)
// GET /rides/child/:childId?type=today
// GET /rides/child/:childId?type=upcoming
// GET /rides/child/:childId?type=history&from=2026-01-01&to=2026-01-18
router.get("/child/:childId", catchAsync(getChildRides));

// ✅ ملخص سجل الرحلات لطفل معين
// GET /rides/child/:childId/summary?month=1&year=2026
router.get("/child/:childId/summary", catchAsync(getRideHistorySummary));

// ============ Occurrence Routes ============

// ✅ تتبع الرحلة لحظياً
router.get("/tracking/:occurrenceId", catchAsync(getLiveTracking));

// ✅ تقديم عذر غياب
router.post("/excuse/:occurrenceId/:studentId", catchAsync(submitExcuse));


export default router;
