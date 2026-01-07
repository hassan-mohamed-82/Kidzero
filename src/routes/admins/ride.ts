// src/routes/admin/rideRoutes.ts

import { Router } from "express";
import {
    createRide,
    getAllRides,
    getRideById,
    updateRide,
    deleteRide,
    addStudentsToRide,
    removeStudentFromRide
} from "../../controllers/admin/ride";
import { validate } from "../../middlewares/validation";
import {
    createRideSchema,
    updateRideSchema,
    rideIdSchema,
    addStudentsToRideSchema,
    updateRideStudentSchema,
    removeStudentFromRideSchema
} from "../../validators/admin/ride";
import { catchAsync } from "../../utils/catchAsync";

const router = Router();

router.post("/", validate(createRideSchema), catchAsync(createRide));
router.get("/", getAllRides);
router.get("/:id", validate(rideIdSchema), catchAsync(getRideById));
router.put("/:id", validate(updateRideSchema), catchAsync(updateRide));
router.delete("/:id", validate(rideIdSchema), catchAsync(deleteRide));
// Students in Ride
router.post("/:id/students", validate(addStudentsToRideSchema), catchAsync(addStudentsToRide));
router.delete("/:id/students/:studentId", validate(removeStudentFromRideSchema), catchAsync(removeStudentFromRide));

export default router;
