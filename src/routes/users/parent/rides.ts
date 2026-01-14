// src/routes/users/parent/rides.ts
import { Router } from "express";
import { authorizeRoles } from "../../../middlewares/authorized";
import { catchAsync } from "../../../utils/catchAsync";
import {
  getMyChildrenRides,
  getLiveTracking,
  submitExcuse,
  getChildRides,
} from "../../../controllers/users/parent/rides";

const router = Router();

// ✅ رحلات أولادي
router.get("/children", authorizeRoles("parent"), catchAsync(getMyChildrenRides));

// ✅ رحلات الطفل
router.get("/child/:childId", authorizeRoles("parent"), catchAsync(getChildRides));

// ✅ تتبع الرحلة لحظياً
router.get("/tracking/:occurrenceId", authorizeRoles("parent"), catchAsync(getLiveTracking));

// ✅ تقديم عذر غياب
router.post("/excuse/:occurrenceId/:studentId", authorizeRoles("parent"), catchAsync(submitExcuse));


export default router;
