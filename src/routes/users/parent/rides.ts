import { Router } from "express";

import{
    getTodayRides,getChildAttendance,getRideDetails,getRidesHistory,reportAbsence,trackRide} from "../../../controllers/users/parent/rides"
import { authorizeRoles } from "../../../middlewares/authorized";

const router = Router();

// Routes for Parent to manage rides
router.get("/today", authorizeRoles("parent"), getTodayRides);
router.get("/history", authorizeRoles("parent"), getRidesHistory);
router.get("/:rideId", authorizeRoles("parent"), getRideDetails);
router.get("/:rideId/track", authorizeRoles("parent"), trackRide);
router.get("/:childId/attendance", authorizeRoles("parent"), getChildAttendance);
router.post("/:rideId/report-absence", authorizeRoles("parent"), reportAbsence);
export default router;