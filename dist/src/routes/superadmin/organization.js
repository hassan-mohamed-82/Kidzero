"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organization_1 = require("../../controllers/superadmin/organization");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const organization_2 = require("../../validators/superadmin/organization");
const organizationTypes_1 = require("../../validators/superadmin/organizationTypes");
const router = (0, express_1.Router)();
// Organization Types Routes
router.get("/types", (0, catchAsync_1.catchAsync)(organization_1.getAllOrganizationTypes));
router.post("/types", (0, validation_1.validate)(organizationTypes_1.createOrganizationTypeSchema), (0, catchAsync_1.catchAsync)(organization_1.createOrganizationType));
router.get("/types/:id", (0, catchAsync_1.catchAsync)(organization_1.getOrganizationTypeById));
router.put("/types/:id", (0, validation_1.validate)(organizationTypes_1.updateOrganizationTypeSchema), (0, catchAsync_1.catchAsync)(organization_1.updateOrganizationType));
router.delete("/types/:id", (0, catchAsync_1.catchAsync)(organization_1.deleteOrganizationType));
// Organizations Routes
router.get("/", (0, catchAsync_1.catchAsync)(organization_1.getAllOrganizations));
router.post("/", (0, validation_1.validate)(organization_2.createOrganizationSchema), (0, catchAsync_1.catchAsync)(organization_1.createOrganization));
router.get("/:id", (0, catchAsync_1.catchAsync)(organization_1.getOrganizationById));
router.put("/:id", (0, validation_1.validate)(organization_2.updateOrganizationSchema), (0, catchAsync_1.catchAsync)(organization_1.updateOrganization));
router.delete("/:id", (0, catchAsync_1.catchAsync)(organization_1.deleteOrganization));
exports.default = router;
