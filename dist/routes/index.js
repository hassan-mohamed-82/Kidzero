import { Router } from "express";
// import usersRoute from "./users";
import superadminRoute from "./superadmin";
import adminRoute from "./admins";
const route = Router();
route.use("/superadmin", superadminRoute);
// route.use("/users", usersRoute);
route.use("/admin", adminRoute);
export default route;
//# sourceMappingURL=index.js.map