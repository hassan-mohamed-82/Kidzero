"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catchAsync_1 = require("../../utils/catchAsync");
const superadminroles_1 = require("../../controllers/superadmin/superadminroles");
const router = (0, express_1.Router)();
// ✅ Super Admin Role Routes
router.get("/", (0, catchAsync_1.catchAsync)(superadminroles_1.getAllRoles));
router.get("/permissions", (0, catchAsync_1.catchAsync)(superadminroles_1.getAvailablePermissions));
router.get("/:id", (0, catchAsync_1.catchAsync)(superadminroles_1.getRoleById));
router.post("/", (0, catchAsync_1.catchAsync)(superadminroles_1.createRole));
router.put("/:id", (0, catchAsync_1.catchAsync)(superadminroles_1.updateRole));
router.delete("/:id", (0, catchAsync_1.catchAsync)(superadminroles_1.deleteRole));
exports.default = router;
