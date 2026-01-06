import { Router } from "express";
import { getAllBusTypes, getBusTypeById, createBusType, updateBusType, deleteBusType } from "../../controllers/superadmin/busTypes";
import { validate } from "../../middlewares/validation";
import { createBusTypeSchema, updateBusTypeSchema } from "../../validators/superadmin/busTypes";
const route = Router();
route.get("/", getAllBusTypes);
route.post("/", validate(createBusTypeSchema), createBusType);
route.get("/:Id", getBusTypeById);
route.put("/:Id", validate(updateBusTypeSchema), updateBusType);
route.delete("/:Id", deleteBusType);
export default route;
//# sourceMappingURL=busTypes.js.map