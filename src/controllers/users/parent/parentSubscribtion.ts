import { Request, Response } from "express";
import { db } from "../../../models/db";
import { parentPlans, parentSubscriptions } from "../../../models/schema";
import { eq, desc } from "drizzle-orm";
import { SuccessResponse } from "../../../utils/response";
import { NotFound } from "../../../Errors/NotFound";


export const getParentSubscriptions = async (req: Request, res: Response) => {
    const user = req.user?.id;
    if (!user) {
        throw new NotFound("User not found");
    }
    // const parentSubscription = await db.query.parentSubscriptions.findMany({
    //     where: eq(parentSubscriptions.parentId, user),
    // });
    const parentSubscription = await db.select({
        id: parentSubscriptions.id,
        parentId: parentSubscriptions.parentId,
        planId: parentSubscriptions.parentPlanId,
        paymentId: parentSubscriptions.parentPaymentId,
        isActive: parentSubscriptions.isActive,
        startDate: parentSubscriptions.startDate,
        endDate: parentSubscriptions.endDate,
        createdAt: parentSubscriptions.createdAt,
        updatedAt: parentSubscriptions.updatedAt,

        plan: {
            id: parentPlans.id,
            name: parentPlans.name,
            price: parentPlans.price
        }
    }).from(parentSubscriptions)
        .leftJoin(parentPlans, eq(parentSubscriptions.parentPlanId, parentPlans.id))
        .where(eq(parentSubscriptions.parentId, user));
    return SuccessResponse(res, { message: "Parent Subscriptions Fetched Successfully", parentSubscription }, 200);
};

export const getParentSubscriptionById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user?.id;
    if (!user) {
        throw new NotFound("User not found");
    }
    if (!id) {
        throw new NotFound("Please provide Subscription Id");
    }
    const parentSubscription = await db.query.parentSubscriptions.findFirst({
        where: eq(parentSubscriptions.id, id),
    });
    return SuccessResponse(res, { message: "Parent Subscription Fetched Successfully", parentSubscription }, 200);
};
