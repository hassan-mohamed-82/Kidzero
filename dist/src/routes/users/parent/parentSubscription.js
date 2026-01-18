"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parentSubscribtion_1 = require("../../../controllers/users/parent/parentSubscribtion");
const catchAsync_1 = require("../../../utils/catchAsync");
const router = (0, express_1.Router)();
router.get("/", (0, catchAsync_1.catchAsync)(parentSubscribtion_1.getParentSubscriptions));
router.get("/:id", (0, catchAsync_1.catchAsync)(parentSubscribtion_1.getParentSubscriptionById));
exports.default = router;
