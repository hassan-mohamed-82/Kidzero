// src/routes/admin/rideRoutes.ts

import { Router } from "express";
import {
    createRide,
    getAllRides,
    getRideById,
    updateRide,
    deleteRide,
    searchStudentsForRide,
    addStudentsToRide,
    removeStudentFromRide,
    selection
} from "../../controllers/admin/ride";
import { validate } from "../../middlewares/validation";
import {
    createRideSchema,
    updateRideSchema,
    rideIdSchema,
    addStudentsToRideSchema,
    removeStudentFromRideSchema,
    

} from "../../validators/admin/ride";
import { catchAsync } from "../../utils/catchAsync";

const router = Router();
 
// ✅ Ride Routes
router.get("/students/search", catchAsync(searchStudentsForRide));
router.post("/", validate(createRideSchema), catchAsync(createRide));
router.get("/", getAllRides);
router.get("/selection", catchAsync(selection));
router.get("/:id", validate(rideIdSchema), catchAsync(getRideById));
router.put("/:id", validate(updateRideSchema), catchAsync(updateRide));
router.delete("/:id", validate(rideIdSchema), catchAsync(deleteRide));
// Students in Ride
router.post("/:id/students", validate(addStudentsToRideSchema), catchAsync(addStudentsToRide));
router.delete("/:id/students/:studentId", validate(removeStudentFromRideSchema), catchAsync(removeStudentFromRide));

export default router;
