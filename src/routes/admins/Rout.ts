import { Router } from "express";
import { getAllRoutes, getRouteById, createRoute,deleteRoute,updateRoute  } from "../../controllers/admin/Rout";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createRouteSchema, updateRouteSchema } from "../../validators/admin/rout";
const router = Router();

router.get("/", catchAsync(getAllRoutes));
router.post("/", validate(createRouteSchema), catchAsync(createRoute));
router.get("/:id", catchAsync(getRouteById));
router.delete("/:id", catchAsync(deleteRoute));
router.put("/:id", validate(updateRouteSchema), catchAsync(updateRoute));
export default router;