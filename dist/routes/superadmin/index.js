import { Router } from "express";
import superAdminAuthRoute from "./auth";
import PlanRoute from "./plan";
import promocodeRoute from "./promocodes";
import busTypeRoute from "./busTypes";
const route = Router();
route.use("/auth", superAdminAuthRoute);
route.use("/plans", PlanRoute);
route.use("/promocodes", promocodeRoute);
route.use("/bustypes", busTypeRoute);
export default route;
//# sourceMappingURL=index.js.map