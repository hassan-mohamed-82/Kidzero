"use strict";
// src/controllers/admin/subscriptionController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyUsage = void 0;
const BadRequest_1 = require("../../Errors/BadRequest");
const helperfunction_1 = require("../../utils/helperfunction");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const getMyUsage = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const usage = await (0, helperfunction_1.getUsageInfo)(organizationId);
    if (!usage) {
        throw new NotFound_1.NotFound("No active subscription found");
    }
    (0, response_1.SuccessResponse)(res, usage, 200);
};
exports.getMyUsage = getMyUsage;
