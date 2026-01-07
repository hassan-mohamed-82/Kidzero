import { Router } from "express";
import { getAllDrivers, getDriverById, createDriver, updateDriver, deleteDriver } from "../../controllers/admin/driver";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createDriverSchema, updateDriverSchema } from "../../validators/admin/driver";
const router = Router();
// ✅ Get All Drivers
router.get("/", catchAsync(getAllDrivers));
// ✅ Get Driver By ID
router.get("/:id", catchAsync(getDriverById));
// ✅ Create Driver
router.post("/", validate(createDriverSchema), catchAsync(createDriver));
// ✅ Update Driver
router.put("/:id", validate(updateDriverSchema), catchAsync(updateDriver));
// ✅ Delete Driver
router.delete("/:id", catchAsync(deleteDriver));
export default router;
