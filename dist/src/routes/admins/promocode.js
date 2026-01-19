"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promocodes_1 = require("../../controllers/admin/promocodes");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
router.post("/verify", (0, catchAsync_1.catchAsync)(promocodes_1.verifyPromocode));
exports.default = router;
