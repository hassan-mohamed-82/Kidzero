import { Request , Response } from 'express';
import { subscriptions } from '../../models/schema';
import { db } from '../../models/db';
import { eq } from 'drizzle-orm';
import { SuccessResponse } from '../../utils/response';

export const getAllSubscribers = async (req: Request, res: Response) => {
    const SubscribedOrganizations = await db.query.organizations.findMany({ where: (organizations) => eq(organizations.status, "subscribed") });
    return SuccessResponse(res, { message:"Fetched subscribed organizations successfully", data: SubscribedOrganizations },200);
};