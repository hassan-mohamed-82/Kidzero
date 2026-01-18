"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roles_1 = require("../../controllers/admin/roles");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const roles_2 = require("../../validators/admin/roles");
const router = (0, express_1.Router)();
// ✅ Super Admin Role Routes
router.get("/permissions", (0, catchAsync_1.catchAsync)(roles_1.getAvailablePermissions));
// ✅ Get All Roles
router.get("/", (0, catchAsync_1.catchAsync)(roles_1.getAllRoles));
// ✅ Get Role By ID
router.get("/:id", (0, catchAsync_1.catchAsync)(roles_1.getRoleById));
// ✅ Create Role
router.post("/", (0, validation_1.validate)(roles_2.createRoleSchema), (0, catchAsync_1.catchAsync)(roles_1.createRole));
// ✅ Update Role
router.put("/:id", (0, validation_1.validate)(roles_2.updateRoleSchema), (0, catchAsync_1.catchAsync)(roles_1.updateRole));
// ✅ Delete Role
router.delete("/:id", (0, catchAsync_1.catchAsync)(roles_1.deleteRole));
exports.default = router;
