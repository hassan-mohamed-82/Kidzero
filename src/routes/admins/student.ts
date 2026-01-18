import { Router } from "express";
import {
 getAllStudents,getStudentById,createStudent,updateStudent,deleteStudent,selection
} from "../../controllers/admin/student";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createStudentSchema, updateStudentSchema } from "../../validators/admin/student";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();
router.get("/",checkPermission("students","View"), catchAsync(getAllStudents));
router.post("/",checkPermission("students","Add"), validate(createStudentSchema), catchAsync(createStudent));
router.get("/selection",checkPermission("students","View"), catchAsync(selection));
router.get("/:id",checkPermission("students","View"), catchAsync(getStudentById));
router.delete("/:id",checkPermission("students","Delete"), catchAsync(deleteStudent));
router.put("/:id",checkPermission("students","Edit"), validate(updateStudentSchema), catchAsync(updateStudent));
export default router;