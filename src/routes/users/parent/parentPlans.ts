import { Router } from "express";
import { getAllParentPlans } from "../../../controllers/superadmin/parentPlan";


const router = Router();

router.get("/", getAllParentPlans);

export default router;