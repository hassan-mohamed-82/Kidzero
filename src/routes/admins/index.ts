import { authenticated } from "../../middlewares/authenticated";
import { authorizeRoles } from "../../middlewares/authorized";
import { catchAsync } from "../../utils/catchAsync";
import AuthRoute from "./auth";
import rolesRouter from "./roles";
import  pickupPointRouter from "./pickuppoint";
import adminRouter from "./admin";
import { Router } from "express";
const route = Router();
route.use("/auth",catchAsync(AuthRoute));
route.use(authenticated, authorizeRoles("admin","organizer"));
route.use("/roles",catchAsync(rolesRouter));
route.use("/pickuppoints",catchAsync(pickupPointRouter));
route.use("/admins",catchAsync(adminRouter));

export default route;
