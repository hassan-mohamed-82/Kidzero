"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organization_1 = require("../../controllers/superadmin/organization");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
// Organization Types Routes
router.get("/types", (0, catchAsync_1.catchAsync)(organization_1.getAllOrganizationTypes));
router.post("/types", (0, catchAsync_1.catchAsync)(organization_1.createOrganizationType));
router.get("/types/:id", (0, catchAsync_1.catchAsync)(organization_1.getOrganizationTypeById));
router.put("/types/:id", (0, catchAsync_1.catchAsync)(organization_1.updateOrganizationType));
router.delete("/types/:id", (0, catchAsync_1.catchAsync)(organization_1.deleteOrganizationType));
// Organizations Routes
router.get("/", (0, catchAsync_1.catchAsync)(organization_1.getAllOrganizations));
router.post("/", (0, catchAsync_1.catchAsync)(organization_1.createOrganization));
router.get("/:id", (0, catchAsync_1.catchAsync)(organization_1.getOrganizationById));
router.put("/:id", (0, catchAsync_1.catchAsync)(organization_1.updateOrganization));
router.delete("/:id", (0, catchAsync_1.catchAsync)(organization_1.deleteOrganization));
exports.default = router;
