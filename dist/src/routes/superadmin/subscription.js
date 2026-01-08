"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_1 = require("../../controllers/superadmin/subscription");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
router.get("/subscribers", (0, catchAsync_1.catchAsync)(subscription_1.getAllSubscribers));
exports.default = router;
