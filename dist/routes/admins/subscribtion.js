"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscribtion_1 = require("../../controllers/admin/subscribtion");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
router.get("/", (0, catchAsync_1.catchAsync)(subscribtion_1.getMySubscriptions));
router.get("/:id", (0, catchAsync_1.catchAsync)(subscribtion_1.getSubscriptionById));
exports.default = router;
