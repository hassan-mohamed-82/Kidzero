import { Router } from "express";
import {createParent,getAllParents,
    getParentById,updateParent,deleteParent
} from "../../controllers/admin/parent";

import { catchAsync } from "../../utils/catchAsync";
import{validate} from "../../middlewares/validation";
import {createParentSchema,updateParentSchema} from "../../validators/admin/parent";
const router = Router();
router.post("/",validate(createParentSchema),catchAsync(createParent));
router.get("/",catchAsync(getAllParents));
router.get("/:id",catchAsync(getParentById));
router.put("/:id",validate(updateParentSchema),catchAsync(updateParent));
router.delete("/:id",catchAsync(deleteParent));
export default router;