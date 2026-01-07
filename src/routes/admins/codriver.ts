import { Router } from "express";
import {
    getAllCodrivers, getCodriverById, createCodriver, updateCodriver, deleteCodriver } from "../../controllers/admin/codriver";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createCodriverSchema, updateCodriverSchema } from "../../validators/admin/codriver";

const router = Router();

// ✅ Get All Codrivers
router.get("/", catchAsync(getAllCodrivers));   
// ✅ Get Codriver By ID
router.get("/:id", catchAsync(getCodriverById));
// ✅ Create Codriver
router.post("/", validate(createCodriverSchema), catchAsync(createCodriver));
// ✅ Update Codriver
router.put("/:id", validate(updateCodriverSchema), catchAsync(updateCodriver));
// ✅ Delete Codriver
router.delete("/:id", catchAsync(deleteCodriver));
export default router;