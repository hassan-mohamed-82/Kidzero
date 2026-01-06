import { Router } from "express";
import { getAllPlans, getPlanbyId, deletePlanById, createPlan, updatePlan } from "../../controllers/superadmin/plan";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createPlanSchema } from "../../validators/superadmin/plan";
import { updatePlanSchema } from "../../validators/superadmin/plan";

const router = Router();

router.get("/", catchAsync(getAllPlans));
router.post("/", validate(createPlanSchema), catchAsync(createPlan));
router.get("/:Id", catchAsync(getPlanbyId));
router.put("/:Id", validate(updatePlanSchema), catchAsync(updatePlan));
router.delete("/:Id", catchAsync(deletePlanById));

export default router;