import { Router } from "express";
import { getAllPlans } from "../../controllers/superadmin/plan";
import { catchAsync } from "../../utils/catchAsync";
import { checkPermission } from "../../middlewares/checkpermission";
const route = Router();

route.get("/",checkPermission("plans","View"), catchAsync(getAllPlans));

export default route;