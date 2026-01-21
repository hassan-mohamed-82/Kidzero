// src/routes/admin/studentRoutes.ts

import { Router } from "express";
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  selection,
  getStudentsWithoutParent,
  getStudentDetails
} from "../../controllers/admin/student";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { createStudentSchema, updateStudentSchema } from "../../validators/admin/student";
import { checkPermission } from "../../middlewares/checkpermission";

const router = Router();

// ✅ Static Routes أولاً
router.get("/selection", checkPermission("students", "View"), catchAsync(selection));
router.get("/without-parent", checkPermission("students", "View"), catchAsync(getStudentsWithoutParent));
router.get("/details/:id", checkPermission("students", "View"), catchAsync(getStudentDetails));

// ✅ CRUD Routes
router.get("/", checkPermission("students", "View"), catchAsync(getAllStudents));
router.post("/", checkPermission("students", "Add"), validate(createStudentSchema), catchAsync(createStudent));

// ✅ Dynamic Routes آخراً
router.get("/:id", checkPermission("students", "View"), catchAsync(getStudentById));
router.put("/:id", checkPermission("students", "Edit"), validate(updateStudentSchema), catchAsync(updateStudent));
router.delete("/:id", checkPermission("students", "Delete"), catchAsync(deleteStudent));

export default router;