"use strict";
// src/routes/users/driver/ride.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorized_1 = require("../../../middlewares/authorized");
const catchAsync_1 = require("../../../utils/catchAsync");
const ride_1 = require("../../../controllers/users/driver/ride");
const router = (0, express_1.Router)();
// ✅ رحلات اليوم
router.get("/today", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.getMyTodayRides));
// ✅ الرحلات القادمة
router.get("/upcoming", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.getUpcomingRides));
// ✅ سجل الرحلات
router.get("/history", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.getRideHistory));
// ✅ تفاصيل الـ Occurrence
router.get("/occurrence/:occurrenceId", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.getOccurrenceForDriver));
// ✅ التحكم بالرحلة
router.post("/occurrence/:occurrenceId/start", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.startRide));
router.post("/occurrence/:occurrenceId/location", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.updateLocation));
router.post("/occurrence/:occurrenceId/complete", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.completeRide));
// ✅ التحكم بالطلاب
router.post("/occurrence/:occurrenceId/students/:studentId/pickup", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.pickUpStudent));
router.post("/occurrence/:occurrenceId/students/:studentId/dropoff", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.dropOffStudent));
router.post("/occurrence/:occurrenceId/students/:studentId/absent", (0, authorized_1.authorizeRoles)("driver", "codriver"), (0, catchAsync_1.catchAsync)(ride_1.markStudentAbsent));
exports.default = router;
