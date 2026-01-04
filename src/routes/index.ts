import { Router } from "express";
import usersRoute from "./users";
import adminRoute from "./admins";
const route = Router();
route.use("/users", usersRoute);
route.use("/admin", adminRoute);
export default route;
