"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Invoice_1 = require("../../controllers/admin/Invoice");
const catchAsync_1 = require("../../utils/catchAsync");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
router.get("/", (0, checkpermission_1.checkPermission)("invoices", "View"), (0, catchAsync_1.catchAsync)(Invoice_1.getMyInvoices));
exports.default = router;
