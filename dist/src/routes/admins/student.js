"use strict";
// src/routes/admin/studentRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_1 = require("../../controllers/admin/student");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const student_2 = require("../../validators/admin/student");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
// ✅ Static Routes أولاً
router.get("/selection", (0, checkpermission_1.checkPermission)("students", "View"), (0, catchAsync_1.catchAsync)(student_1.selection));
router.get("/without-parent", (0, checkpermission_1.checkPermission)("students", "View"), (0, catchAsync_1.catchAsync)(student_1.getStudentsWithoutParent));
router.get("/details/:id", (0, checkpermission_1.checkPermission)("students", "View"), (0, catchAsync_1.catchAsync)(student_1.getStudentDetails));
// ✅ CRUD Routes
router.get("/", (0, checkpermission_1.checkPermission)("students", "View"), (0, catchAsync_1.catchAsync)(student_1.getAllStudents));
router.post("/", (0, checkpermission_1.checkPermission)("students", "Add"), (0, validation_1.validate)(student_2.createStudentSchema), (0, catchAsync_1.catchAsync)(student_1.createStudent));
// ✅ Dynamic Routes آخراً
router.get("/:id", (0, checkpermission_1.checkPermission)("students", "View"), (0, catchAsync_1.catchAsync)(student_1.getStudentById));
router.put("/:id", (0, checkpermission_1.checkPermission)("students", "Edit"), (0, validation_1.validate)(student_2.updateStudentSchema), (0, catchAsync_1.catchAsync)(student_1.updateStudent));
router.delete("/:id", (0, checkpermission_1.checkPermission)("students", "Delete"), (0, catchAsync_1.catchAsync)(student_1.deleteStudent));
exports.default = router;
