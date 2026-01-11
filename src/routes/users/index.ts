import { Router } from "express";
import {authorizeRoles} from "../../middlewares/authorized"
import { authenticated } from "../../middlewares/authenticated";
import authRouter from "./auth";
import profileRouter from "./profile";
import childRouter from "./parent/student";
import rideRouter from "./parent/rides";

const router = Router();

router.use("/auth", authRouter);
router.use(authenticated,authorizeRoles("driver","parent","codriver"));
router.use("/profile", profileRouter);
router.use("/children", childRouter);
router.use("/rides", rideRouter);
export default router;