import { Router } from "express";
import {
    getAllCodrivers, getCodriverById, createCodriver, updateCodriver, deleteCodriver } from "../../controllers/admin/codriver";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createCodriverSchema, updateCodriverSchema } from "../../validators/admin/codriver";
import { checkPermission } from "../../middlewares/checkpermission";

const router = Router();

// ✅ Get All Codrivers
router.get("/",checkPermission("codrivers","View"), catchAsync(getAllCodrivers));   
// ✅ Get Codriver By ID
router.get("/:id",checkPermission("codrivers","View"), catchAsync(getCodriverById));
// ✅ Create Codriver
router.post("/",checkPermission("codrivers","Add"), validate(createCodriverSchema), catchAsync(createCodriver));
// ✅ Update Codriver
router.put("/:id",checkPermission("codrivers","Edit"), validate(updateCodriverSchema), catchAsync(updateCodriver));
// ✅ Delete Codriver
router.delete("/:id",checkPermission("codrivers","Delete"), catchAsync(deleteCodriver));
export default router;