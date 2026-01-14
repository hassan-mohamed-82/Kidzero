import { Router } from "express";
import { getAllPlans } from "../../controllers/superadmin/plan";
import { catchAsync } from "../../utils/catchAsync";

const route = Router();
``
route.get("/", catchAsync(getAllPlans));

export default route;