// src/controllers/admin/subscriptionController.ts

import { BadRequest } from "../../Errors/BadRequest";
import { getUsageInfo } from "../../utils/helperfunction";
import { Request, Response } from "express";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
export const getMyUsage = async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new BadRequest("Organization ID is required");
  }

  const usage = await getUsageInfo(organizationId);

  if (!usage) {
    throw new NotFound("No active subscription found");
  }

  SuccessResponse(res, usage, 200);
};
