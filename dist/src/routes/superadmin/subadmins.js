"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catchAsync_1 = require("../../utils/catchAsync");
const subadmins_1 = require("../../controllers/superadmin/subadmins");
const validation_1 = require("../../middlewares/validation");
const subadmins_2 = require("../../validators/superadmin/subadmins");
const router = (0, express_1.Router)();
// ✅ SubAdmin Routes
router.get("/", (0, catchAsync_1.catchAsync)(subadmins_1.getAllSubAdmins));
router.post("/", (0, validation_1.validate)(subadmins_2.createSubAdminSchema), (0, catchAsync_1.catchAsync)(subadmins_1.createSubAdmin));
router.get("/:id", (0, catchAsync_1.catchAsync)(subadmins_1.getSubAdminById));
router.put("/:id", (0, validation_1.validate)(subadmins_2.updateSubAdminSchema), (0, catchAsync_1.catchAsync)(subadmins_1.updateSubAdmin));
router.delete("/:id", (0, catchAsync_1.catchAsync)(subadmins_1.deleteSubAdmin));
exports.default = router;
