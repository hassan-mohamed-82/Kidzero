import { Router } from "express";
import { getAllParentPlans, getParentPlanbyId, deleteParentPlanById, createParentPlan, updateParentPlan } from "../../controllers/superadmin/parentPlan";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createParentPlanSchema, updateParentPlanSchema } from "../../validators/superadmin/parentplan";
const router = Router();

router.get("/", catchAsync(getAllParentPlans));
router.post("/", validate(createParentPlanSchema), catchAsync(createParentPlan));
router.get("/:id", catchAsync(getParentPlanbyId));
router.delete("/:id", catchAsync(deleteParentPlanById));
router.put("/:id", validate(updateParentPlanSchema), catchAsync(updateParentPlan));


export default router;