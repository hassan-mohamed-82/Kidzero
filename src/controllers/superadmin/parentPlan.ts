import { Request , Response } from "express";
import { db } from "../../models/db";
import { parentPlans } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { eq } from "drizzle-orm";
import { NotFound } from "../../Errors";


export const getAllParentPlans = async (req: Request, res: Response) => {
    const allParentPlans = await db.query.parentPlans.findMany();
    return SuccessResponse(res, { message: "Parent Plans Fetched Successfully", parentPlans: allParentPlans }, 200);
};

export const getParentPlanbyId = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Please Enter Parent Plan Id");
    }
    const parentPlan = await db.query.parentPlans.findFirst({
        where: eq(parentPlans.id, id)
    });
    if (!parentPlan) {
        throw new NotFound("Parent Plan not found");
    }
    return SuccessResponse(res, { message: "Parent Plan Fetched Successfully", parentPlan }, 200);
};

export const deleteParentPlanById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Please Enter Parent Plan Id");
    }
    const parentPlan = await db.query.parentPlans.findFirst({
        where: eq(parentPlans.id, id)
    });
    if (!parentPlan) {
        throw new NotFound("Parent Plan not found");
    }
    await db.delete(parentPlans).where(eq(parentPlans.id, id));
    return SuccessResponse(res, { message: "Parent Plan Deleted Successfully" }, 200);
};

export const createParentPlan = async (req: Request, res: Response) => {
    const { name, price, startDate, endDate , minSubscriptionfeesPay , subscriptionFees } = req.body;

    if (!name || !subscriptionFees || !minSubscriptionfeesPay) {
        throw new BadRequest("Please provide all required fields: name, subscriptionFees , minSubscriptionfeesPay");
    }

    if (!startDate || !endDate) {
        throw new BadRequest("Please provide startDate and endDate");
    }
    await db.insert(parentPlans).values({
        name,
        price,
        minSubscriptionFeesPay: minSubscriptionfeesPay || 0,
        subscriptionFees
    });
    return SuccessResponse(res, { message: "Parent Plan Created Successfully" }, 201);
};

export const updateParentPlan = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Please Enter Parent Plan Id");
    }
    const { name, price, startDate, endDate , minSubscriptionfeesPay , subscriptionFees } = req.body;
    const parentPlan =  await db.query.parentPlans.findFirst({
        where: eq(parentPlans.id, id)
    });

    if (!parentPlan) {
        throw new NotFound("Parent Plan not found");
    }
    await db.update(parentPlans).set({
        name: name !== undefined ? name : parentPlan.name,
        price: price !== undefined ? price : parentPlan.price,
        minSubscriptionFeesPay: minSubscriptionfeesPay !== undefined ? minSubscriptionfeesPay : parentPlan.minSubscriptionFeesPay,
        subscriptionFees: subscriptionFees !== undefined ? subscriptionFees : parentPlan.subscriptionFees,
    }).where(eq(parentPlans.id, id));

    return SuccessResponse(res, { message: "Parent Plan Updated Successfully" }, 200);
};