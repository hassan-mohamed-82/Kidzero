import { Router } from "express";
import { getAllBusTypes, getBusTypeById, createBusType, updateBusType , deleteBusType } from "../../controllers/superadmin/busTypes";
import { validate } from "../../middlewares/validation";
import { createBusTypeSchema, updateBusTypeSchema } from "../../validators/superadmin/busTypes";
import { catchAsync } from "../../utils/catchAsync";
const route = Router();

route.get("/", catchAsync(getAllBusTypes));
route.post("/", validate(createBusTypeSchema), catchAsync(createBusType));
route.get("/:Id", catchAsync(getBusTypeById));
route.put("/:Id", validate(updateBusTypeSchema), catchAsync(updateBusType));
route.delete("/:Id", catchAsync(deleteBusType));

export default route;