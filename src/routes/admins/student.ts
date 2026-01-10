import { Router } from "express";
import {
 getAllStudents,getStudentById,createStudent,updateStudent,deleteStudent,selection
} from "../../controllers/admin/student";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createStudentSchema, updateStudentSchema } from "../../validators/admin/student";
const router = Router();
router.get("/", catchAsync(getAllStudents));
router.post("/", validate(createStudentSchema), catchAsync(createStudent));
router.get("/selection", catchAsync(selection));
router.get("/:id", catchAsync(getStudentById));
router.delete("/:id", catchAsync(deleteStudent));
router.put("/:id", validate(updateStudentSchema), catchAsync(updateStudent));
export default router;