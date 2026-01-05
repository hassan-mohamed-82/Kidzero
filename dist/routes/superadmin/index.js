import { Router } from "express";
import superAdminAuthRoute from "./auth";
const route = Router();
route.use("/auth", superAdminAuthRoute);
export default route;
//# sourceMappingURL=index.js.map