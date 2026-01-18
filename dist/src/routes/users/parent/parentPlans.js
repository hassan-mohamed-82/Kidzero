"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parentPlan_1 = require("../../../controllers/superadmin/parentPlan");
const router = (0, express_1.Router)();
router.get("/", parentPlan_1.getAllParentPlans);
exports.default = router;
