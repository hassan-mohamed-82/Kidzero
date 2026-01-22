"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catchAsync_1 = require("../../../utils/catchAsync");
const organizationServices_1 = require("../../../controllers/users/parent/organizationServices");
const router = (0, express_1.Router)();
router.get("/:studentId", (0, catchAsync_1.catchAsync)(organizationServices_1.getAllAvailableOrganizationServices));
exports.default = router;
