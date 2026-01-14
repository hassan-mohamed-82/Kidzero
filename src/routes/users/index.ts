import { Router } from "express";
import {authorizeRoles} from "../../middlewares/authorized"
import { authenticated } from "../../middlewares/authenticated";
import authRouter from "./auth";
import profileRouter from "./profile";
import childRouter from "./parent/student";
import rideRouter from "./parent/rides";
import parentPaymentRouter from "./parent/parentPayment";
import rideRouterDriver from "./driver/rides";

const router = Router();

router.use("/auth", authRouter);
router.use(authenticated);
router.use("/profile", profileRouter);
router.use("/children", childRouter);
router.use("/rides", rideRouter);
router.use("/parentpayments", parentPaymentRouter);

router.use("/driver/rides", rideRouterDriver);
export default router;