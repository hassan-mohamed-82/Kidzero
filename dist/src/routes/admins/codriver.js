"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const codriver_1 = require("../../controllers/admin/codriver");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const codriver_2 = require("../../validators/admin/codriver");
const router = (0, express_1.Router)();
// ✅ Get All Codrivers
router.get("/", (0, catchAsync_1.catchAsync)(codriver_1.getAllCodrivers));
// ✅ Get Codriver By ID
router.get("/:id", (0, catchAsync_1.catchAsync)(codriver_1.getCodriverById));
// ✅ Create Codriver
router.post("/", (0, validation_1.validate)(codriver_2.createCodriverSchema), (0, catchAsync_1.catchAsync)(codriver_1.createCodriver));
// ✅ Update Codriver
router.put("/:id", (0, validation_1.validate)(codriver_2.updateCodriverSchema), (0, catchAsync_1.catchAsync)(codriver_1.updateCodriver));
// ✅ Delete Codriver
router.delete("/:id", (0, catchAsync_1.catchAsync)(codriver_1.deleteCodriver));
exports.default = router;
