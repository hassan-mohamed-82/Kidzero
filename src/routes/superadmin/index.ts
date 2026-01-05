import { Router } from "express";
import superAdminAuthRoute from "./auth";
import PlanRoute from "./plan";
const route = Router();
route.use("/auth", superAdminAuthRoute);
route.use("/plans", PlanRoute);
export default route;                           