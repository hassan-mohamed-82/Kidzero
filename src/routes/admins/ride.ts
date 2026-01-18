// src/routes/admin/rideRoutes.ts

import { Router } from "express";
import {
    createRide,
    getAllRides,
    getRideById,
    updateRide,
    deleteRide,
    searchStudentsForRide,
    // removeStudentFromRide,
    selection,
    getRidesByDate,
    getOccurrenceDetails,
    getUpcomingRides,
    updateOccurrenceStatus,
} from "../../controllers/admin/ride";
import { validate } from "../../middlewares/validation";
import {
    createRideSchema,
    updateRideSchema,
    rideIdSchema,
    addStudentsToRideSchema,
    removeStudentFromRideSchema,
    getRidesByDateSchema,
} from "../../validators/admin/ride";
import { catchAsync } from "../../utils/catchAsync";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();

// ✅ Static Routes (يجب أن تكون قبل المسارات الديناميكية)
router.get("/students/search",checkPermission("rides","View"), catchAsync(searchStudentsForRide));
router.get("/selection",checkPermission("rides","View"), catchAsync(selection));
router.get("/upcoming",checkPermission("rides","View"), catchAsync(getUpcomingRides));
router.post("/by-date",checkPermission("rides","View"), validate(getRidesByDateSchema), catchAsync(getRidesByDate));

// ✅ Occurrence Routes (قبل الـ Dynamic Routes)
router.get("/occurrence/:occurrenceId",checkPermission("rides","View"), catchAsync(getOccurrenceDetails));
router.put("/occurrence/:occurrenceId/status",checkPermission("rides","Edit"), catchAsync(updateOccurrenceStatus));

// ✅ CRUD Routes
router.post("/",checkPermission("rides","Add"), validate(createRideSchema), catchAsync(createRide));
router.get("/",checkPermission("rides","View"), catchAsync(getAllRides));

// ✅ Dynamic Routes (المسارات التي تحتوي على :id)
router.get("/:id",checkPermission("rides","View"), validate(rideIdSchema), catchAsync(getRideById));
router.put("/:id",checkPermission("rides","Edit"), validate(updateRideSchema), catchAsync(updateRide));
router.delete("/:id",checkPermission("rides","Delete"), validate(rideIdSchema), catchAsync(deleteRide));

// ✅ Students in Ride Routes
// router.post("/:id/students", validate(addStudentsToRideSchema), catchAsync(addStudentsToRide));
// router.delete("/:id/students/:studentId", validate(removeStudentFromRideSchema), catchAsync(removeStudentFromRide));

export default router;
