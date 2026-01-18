import { Router } from "express";
import { createZone,updateZone,getZoneById,getZones ,deleteZone} from "../../controllers/admin/zone";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createZoneSchema, updateZoneSchema } from "../../validators/admin/zone";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();
// ✅ Create Zone
router.post("/",checkPermission("Zone","Add"), validate(createZoneSchema), catchAsync(createZone));
// ✅ Get All Zones
router.get("/",checkPermission("Zone","View"), catchAsync(getZones));
// ✅ Get Zone By ID
router.get("/:id",checkPermission("Zone","View"), catchAsync(getZoneById));
// ✅ Update Zone
router.put("/:id",checkPermission("Zone","Edit"), validate(updateZoneSchema), catchAsync(updateZone));
// ✅ Delete Zone
router.delete("/:id",checkPermission("Zone","Delete"), catchAsync(deleteZone));
export default router;