import { Router } from "express";
import { getAllBusTypes, getBusTypeById, createBusType, updateBusType, deleteBusType } from "../../controllers/superadmin/busTypes";
const route = Router();
route.get("/", getAllBusTypes);
route.post("/", createBusType);
route.get("/:Id", getBusTypeById);
route.put("/:Id", updateBusType);
route.delete("/:Id", deleteBusType);
export default route;
//# sourceMappingURL=busTypes.js.map