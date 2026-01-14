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

const router = Router();

// ✅ Static Routes (يجب أن تكون قبل المسارات الديناميكية)
router.get("/students/search", catchAsync(searchStudentsForRide));
router.get("/selection", catchAsync(selection));
router.get("/upcoming", catchAsync(getUpcomingRides));
router.post("/by-date", validate(getRidesByDateSchema), catchAsync(getRidesByDate));

// ✅ Occurrence Routes (قبل الـ Dynamic Routes)
router.get("/occurrence/:occurrenceId", catchAsync(getOccurrenceDetails));
router.put("/occurrence/:occurrenceId/status", catchAsync(updateOccurrenceStatus));

// ✅ CRUD Routes
router.post("/", validate(createRideSchema), catchAsync(createRide));
router.get("/", catchAsync(getAllRides));

// ✅ Dynamic Routes (المسارات التي تحتوي على :id)
router.get("/:id", validate(rideIdSchema), catchAsync(getRideById));
router.put("/:id", validate(updateRideSchema), catchAsync(updateRide));
router.delete("/:id", validate(rideIdSchema), catchAsync(deleteRide));

// ✅ Students in Ride Routes
// router.post("/:id/students", validate(addStudentsToRideSchema), catchAsync(addStudentsToRide));
// router.delete("/:id/students/:studentId", validate(removeStudentFromRideSchema), catchAsync(removeStudentFromRide));

export default router;
