import { Router } from "express";
import { getAllRoutes, getRouteById, createRoute,deleteRoute,updateRoute,getAllPickupPoints } from "../../controllers/admin/Rout";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createRouteSchema, updateRouteSchema } from "../../validators/admin/rout";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();

router.get("/",checkPermission("routes","View"), catchAsync(getAllRoutes));
router.get("/pickup-points",checkPermission("routes","View"), catchAsync(getAllPickupPoints));
router.post("/",checkPermission("routes","Add"), validate(createRouteSchema), catchAsync(createRoute));
router.get("/:id",checkPermission("routes","View"), catchAsync(getRouteById));
router.delete("/:id",checkPermission("routes","Delete"), catchAsync(deleteRoute));
router.put("/:id",checkPermission("routes","Edit"), validate(updateRouteSchema), catchAsync(updateRoute));
export default router;