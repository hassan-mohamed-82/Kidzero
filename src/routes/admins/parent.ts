import { Router } from "express";
import {createParent,getAllParents,
    getParentById,updateParent,deleteParent
} from "../../controllers/admin/parent";
import { checkPermission } from "../../middlewares/checkpermission";
import { catchAsync } from "../../utils/catchAsync";
import{validate} from "../../middlewares/validation";
import {createParentSchema,updateParentSchema} from "../../validators/admin/parent";
const router = Router();
router.post("/",checkPermission("parents","Add"),validate(createParentSchema),catchAsync(createParent));
router.get("/",checkPermission("parents","View"),catchAsync(getAllParents));
router.get("/:id",checkPermission("parents","View"),catchAsync(getParentById));
router.put("/:id",checkPermission("parents","Edit"),validate(updateParentSchema),catchAsync(updateParent));
router.delete("/:id",checkPermission("parents","Delete"),catchAsync(deleteParent));
export default router;