"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organization_1 = require("../../controllers/superadmin/organization");
const router = (0, express_1.Router)();
// Organization Types Routes
router.get("/types", organization_1.getAllOrganizationTypes);
router.post("/types", organization_1.createOrganizationType);
router.get("/types/:id", organization_1.getOrganizationTypeById);
router.put("/types/:id", organization_1.updateOrganizationType);
router.delete("/types/:id", organization_1.deleteOrganizationType);
exports.default = router;
