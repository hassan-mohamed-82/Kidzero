import { Router } from "express";
import { getAllParentPlans, getParentPlanbyId, deleteParentPlanById, createParentPlan , updateParentPlan } from "../../controllers/superadmin/parentPlan";
import {catchAsync} from "../../utils/catchAsync";
const router = Router();

router.get("/", catchAsync(getAllParentPlans));
router.post("/", catchAsync(createParentPlan));
router.get("/:id", catchAsync(getParentPlanbyId));
router.delete("/:id", catchAsync(deleteParentPlanById));
router.put("/:id", catchAsync(updateParentPlan));


export default router;