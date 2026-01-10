import { Router } from "express";
import {authorizeRoles} from "../../middlewares/authorized"
import { authenticated } from "../../middlewares/authenticated";
import authRouter from "./auth";
import profileRouter from "./profile";

const router = Router();

router.use("/auth", authRouter);
router.use(authenticated,authorizeRoles("driver","parent","codriver"));
router.use("/profile", profileRouter);
export default router;