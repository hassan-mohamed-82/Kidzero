// src/routes/users/driver/ride.ts
import { Router } from "express";
import { authorizeRoles } from "../../../middlewares/authorized";
import { catchAsync } from "../../../utils/catchAsync";
import { 
  getMyTodayRides,
  getOccurrenceForDriver, 
  startRide, 
  updateLocation, 
  completeRide,
  pickUpStudent, 
  dropOffStudent, 
  markStudentAbsent 
} from "../../../controllers/users/driver/ride";

const router = Router();

// ✅ رحلات اليوم
router.get("/today", authorizeRoles("driver", "codriver"), catchAsync(getMyTodayRides));

// ✅ تفاصيل الـ Occurrence
router.get("/occurrence/:occurrenceId", authorizeRoles("driver", "codriver"), catchAsync(getOccurrenceForDriver));

// ✅ التحكم بالرحلة
router.post("/occurrence/:occurrenceId/start", authorizeRoles("driver", "codriver"), catchAsync(startRide));
router.post("/occurrence/:occurrenceId/location", authorizeRoles("driver", "codriver"), catchAsync(updateLocation));
router.post("/occurrence/:occurrenceId/complete", authorizeRoles("driver", "codriver"), catchAsync(completeRide));

// ✅ التحكم بالطلاب
router.post("/occurrence/:occurrenceId/students/:studentId/pickup", authorizeRoles("driver", "codriver"), catchAsync(pickUpStudent));
router.post("/occurrence/:occurrenceId/students/:studentId/dropoff", authorizeRoles("driver", "codriver"), catchAsync(dropOffStudent));
router.post("/occurrence/:occurrenceId/students/:studentId/absent", authorizeRoles("driver", "codriver"), catchAsync(markStudentAbsent));

export default router;