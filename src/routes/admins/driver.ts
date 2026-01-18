import { Router } from "express";
import { getAllDrivers, getDriverById, createDriver, updateDriver, deleteDriver } from "../../controllers/admin/driver";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createDriverSchema, updateDriverSchema } from "../../validators/admin/driver";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();
// ✅ Get All Drivers
router.get("/",checkPermission("drivers","View"), catchAsync(getAllDrivers));
// ✅ Get Driver By ID
router.get("/:id",checkPermission("drivers","View"), catchAsync(getDriverById));
// ✅ Create Driver
router.post("/",checkPermission("drivers","Add"), validate(createDriverSchema), catchAsync(createDriver));
// ✅ Update Driver
router.put("/:id",checkPermission("drivers","Edit"), validate(updateDriverSchema), catchAsync(updateDriver));
// ✅ Delete Driver
router.delete("/:id",checkPermission("drivers","Delete"), catchAsync(deleteDriver));
export default router;
