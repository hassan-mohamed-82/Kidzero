import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authenticated } from "../../middlewares/authenticated";
import {isBirthdayToday } from "../../controllers/users/checkBirthday";
const router = Router();

router.get("/",authenticated,catchAsync(isBirthdayToday))
export default router;