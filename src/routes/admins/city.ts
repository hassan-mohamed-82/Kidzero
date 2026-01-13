import { Router } from "express";
import { createCity, getCities, getCityById, updateCity,getCitiesWithZones,getCityWithZones } from "../../controllers/admin/city";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createCitySchema, updateCitySchema } from "../../validators/admin/city";
const router = Router();

// ✅ Create City
router.post("/", validate(createCitySchema), catchAsync(createCity));
// ✅ Get All Cities
router.get("/", catchAsync(getCities));
// ✅ Get All Cities With Zones
router.get("/zones", catchAsync(getCitiesWithZones));
// ✅ Get City By ID
router.get("/:id", catchAsync(getCityById));
// ✅ Update City
router.put("/:id", validate(updateCitySchema), catchAsync(updateCity));
// ✅ Get City With Zones
router.get("/zones/:id", catchAsync(getCityWithZones));
export default router;