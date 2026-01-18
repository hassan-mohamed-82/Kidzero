import { Router } from "express";
import { createCity, getCities, getCityById, updateCity,getCitiesWithZones,getCityWithZones } from "../../controllers/admin/city";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createCitySchema, updateCitySchema } from "../../validators/admin/city";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();

// ✅ Create City
router.post("/",checkPermission("City","Add"), validate(createCitySchema), catchAsync(createCity));
// ✅ Get All Cities
router.get("/",checkPermission("City","View"), catchAsync(getCities));
// ✅ Get All Cities With Zones
router.get("/zones",checkPermission("City","View"), catchAsync(getCitiesWithZones));
// ✅ Get City By ID
router.get("/:id",checkPermission("City","View"), catchAsync(getCityById));
// ✅ Update City
router.put("/:id",checkPermission("City","Edit"), validate(updateCitySchema), catchAsync(updateCity));
// ✅ Get City With Zones
router.get("/zones/:id",checkPermission("City","View"), catchAsync(getCityWithZones));
export default router;