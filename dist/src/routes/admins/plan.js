"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const plan_1 = require("../../controllers/superadmin/plan");
const catchAsync_1 = require("../../utils/catchAsync");
const route = (0, express_1.Router)();
``;
route.get("/", (0, catchAsync_1.catchAsync)(plan_1.getAllPlans));
exports.default = route;
