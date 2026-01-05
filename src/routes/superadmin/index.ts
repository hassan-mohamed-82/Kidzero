import { Router } from "express";
import superAdminAuthRoute from "./auth";
import PlanRoute from "./plan";
import promocodeRoute from "./promocodes";
import busTypeRoute from "./busTypes";
import {authorizeRoles} from "../../middlewares/authorized"
import { authenticated } from "../../middlewares/authenticated";
const route = Router();
route.use("/auth", superAdminAuthRoute);
route.use(authenticated,authorizeRoles("superadmin"));
route.use("/plans", PlanRoute);
route.use("/promocodes", promocodeRoute);
route.use("/bustypes", busTypeRoute);
export default route;                           