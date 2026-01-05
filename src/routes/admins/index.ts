import { authenticated } from "../../middlewares/authenticated";
import { authorizeRoles } from "../../middlewares/authorized";
import { catchAsync } from "../../utils/catchAsync";
import AuthRoute from "./auth";

import { Router } from "express";
const route = Router();
route.use("/auth",catchAsync(AuthRoute));
route.use(authenticated, authorizeRoles("admin","organizer"));

export default route;
